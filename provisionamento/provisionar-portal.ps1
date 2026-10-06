<#
.SYNOPSIS
  Cria (ou atualiza) no site do SharePoint as listas e a biblioteca que o Portal do Escritório de Projetos usa como banco de dados.
  v3.2: corrige a coluna Gate, adiciona AprovadoPor/DataAprovacao/Parecer e repara gates antigos.
  v3.6: cria os gates G1..G4 que faltarem para cada projeto da lista.
  v3.7: aponta e (com -LimparGatesDuplicados) remove gates repetidos; cria a visão 'Por projeto'.
  v3.14: tipos de projeto VMware, Omnissa e Client (substitui 'VMware / EUC').
  v3.19: colunas da reunião do Teams em Portal Atividades.
  v3.23: coluna ReuniaoTipo (Implementação, Alinhamento, Interna, Execução).
  v3.24: lista Portal Tecnicos (Nome, E-mail, Função, Ativo) com os técnicos da Systech.
  v3.33: colunas da atualização semanal e do responsável em Portal Atividades.

.EXEMPLOS
  # só a estrutura (listas vazias)
  .\provisionar-portal.ps1 -SiteUrl "https://suaempresa.sharepoint.com/sites/TesteProjetos" -ClientId "<id do app PnP>"

  # remover gates repetidos do mesmo projeto (mantém o mais avançado)
  .\provisionar-portal.ps1 -SiteUrl "https://suaempresa.sharepoint.com/sites/TesteProjetos" -ClientId "<id do app PnP>" -LimparGatesDuplicados

  # estrutura + piloto TRF1 + upload do Design & Build na pasta 02 · Planejamento
  .\provisionar-portal.ps1 -SiteUrl "https://suaempresa.sharepoint.com/sites/TesteProjetos" -ClientId "<id do app PnP>" -Piloto -ArquivoDesignBuild "C:\docs\Design__Build-VMware_Cloud_Foundation-TRF1_v2.docx"

.REQUISITOS
  PowerShell 7.4+, Install-Module PnP.PowerShell -Scope CurrentUser e um app do PnP registrado no Entra ID
  (Register-PnPEntraIDAppForInteractiveLogin). Pode rodar mais de uma vez: o que já existe é mantido.
#>
param(
  [Parameter(Mandatory = $true)] [string] $SiteUrl,
  [Parameter(Mandatory = $true)] [string] $ClientId,
  [switch] $Piloto,
  [string] $ArquivoDesignBuild = '',
  # remove itens repetidos em Portal Gates (mesmo projeto e mesmo gate), mantendo o mais avançado
  [switch] $LimparGatesDuplicados
)
$ErrorActionPreference = 'Stop'
Import-Module PnP.PowerShell
Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId

$FASES = @('Iniciação', 'Planejamento', 'Execução', 'Monitoramento', 'Encerramento')
$PASTAS = @('01 · Iniciação', '02 · Planejamento', '03 · Execução', '04 · Monitoramento e controle', '05 · Encerramento')
$BIB = 'Documentos de Projetos'

function Lista([string]$Titulo, [string]$Url, [string]$Modelo = 'GenericList') {
  if (-not (Get-PnPList -Identity $Titulo -ErrorAction SilentlyContinue)) {
    Write-Host "Criando $Titulo" -ForegroundColor Cyan
    New-PnPList -Title $Titulo -Url $Url -Template $Modelo -OnQuickLaunch | Out-Null
  } else { Write-Host "$Titulo já existe" -ForegroundColor DarkGray }
}
function Tem([string]$L, [string]$N) { [bool](Get-PnPField -List $L -Identity $N -ErrorAction SilentlyContinue) }
function Campo([string]$L, [string]$N, [string]$Rot, [string]$Tipo, [string[]]$Opcoes = $null) {
  if (Tem $L $N) { return }
  if ($Tipo -eq 'Choice') { Add-PnPField -List $L -InternalName $N -DisplayName $Rot -Type Choice -Choices $Opcoes -AddToDefaultView | Out-Null }
  else { Add-PnPField -List $L -InternalName $N -DisplayName $Rot -Type $Tipo -AddToDefaultView | Out-Null }
}
function CampoData([string]$L, [string]$N, [string]$Rot) {
  if (Tem $L $N) { return }
  Add-PnPFieldFromXml -List $L -FieldXml "<Field Type='DateTime' Format='DateOnly' DisplayName='$Rot' Name='$N' StaticName='$N' />" | Out-Null
}
# Troca as opções de uma coluna de escolha editando o esquema (SchemaXml) — funciona em qualquer versão do PnP.
function Atualizar-Opcoes([string]$Lista, [string]$Interno, [string[]]$Opcoes) {
  $campo = Get-PnPField -List $Lista -Identity $Interno
  $xml = [xml]$campo.SchemaXml
  $no = $xml.DocumentElement.SelectSingleNode('CHOICES')
  if (-not $no) { $no = $xml.CreateElement('CHOICES'); [void]$xml.DocumentElement.AppendChild($no) }
  $no.RemoveAll()
  foreach ($o in $Opcoes) { $c = $xml.CreateElement('CHOICE'); $c.InnerText = $o; [void]$no.AppendChild($c) }
  $campo.SchemaXml = $xml.OuterXml
  $campo.Update()
  Invoke-PnPQuery
  Write-Host "  opções de ${Interno}: $($Opcoes -join ', ')" -ForegroundColor DarkGray
}

function Projeto([string]$L) {
  if (Tem $L 'Projeto') { return }
  $alvo = Get-PnPList -Identity 'Portal Projetos'
  Add-PnPFieldFromXml -List $L -FieldXml "<Field Type='Lookup' DisplayName='Projeto' Name='Projeto' StaticName='Projeto' List='{$($alvo.Id)}' ShowField='Codigo' Indexed='TRUE' Required='TRUE' />" | Out-Null
}
function Titulo([string]$L, [string]$Rot) { Set-PnPField -List $L -Identity 'Title' -Values @{ Title = $Rot } | Out-Null }

# ------------------------------------------------------------ Portal Projetos
$L = 'Portal Projetos'; Lista $L 'Lists/PortalProjetos'; Titulo $L 'Nome do projeto'
Campo $L 'Codigo' 'Código' 'Text'
Campo $L 'Cliente' 'Cliente' 'Text'
$TIPOS = @('VMware', 'Omnissa', 'Client', 'Storage', 'Servidores', 'Backup', 'Rede')
Campo $L 'TipoProjeto' 'Tipo' 'Choice' $TIPOS
# v3.14: atualiza as opções da coluna existente e troca "VMware / EUC" por "VMware" nos projetos gravados
# (troca as opções editando o esquema da coluna; não interrompe o script se falhar)
try {
  Atualizar-Opcoes $L 'TipoProjeto' $TIPOS
  foreach ($it in (Get-PnPListItem -List $L -PageSize 500 | Where-Object { [string]$_['TipoProjeto'] -eq 'VMware / EUC' })) {
    Set-PnPListItem -List $L -Identity $it.Id -Values @{ TipoProjeto = 'VMware' } | Out-Null
    Write-Host "  tipo do projeto $($it['Codigo']) atualizado para VMware" -ForegroundColor Green
  }
} catch {
  Write-Warning "Não foi possível atualizar as opções da coluna Tipo: $($_.Exception.Message). O restante do script continua."
}
Campo $L 'Fase' 'Fase' 'Choice' $FASES
Campo $L 'Farol' 'Farol' 'Choice' @('Verde', 'Amarelo', 'Vermelho')
Campo $L 'Situacao' 'Situação do cadastro' 'Choice' @('Rascunho', 'Em aprovação', 'Ativo', 'Encerrado')
Campo $L 'Gerente' 'Gerente de projeto' 'Text'
Campo $L 'Arquiteto' 'Arquiteto' 'Text'
Campo $L 'Patrocinador' 'Patrocinador' 'Text'
Campo $L 'Contrato' 'Contrato / pedido' 'Text'
CampoData $L 'DataInicio' 'Início'
CampoData $L 'DataTerminoBaseline' 'Término (baseline)'
CampoData $L 'DataTerminoPrevista' 'Término previsto'
Campo $L 'Objetivo' 'Objetivo' 'Note'
Campo $L 'EscopoIncluido' 'No escopo (um por linha)' 'Note'
Campo $L 'EscopoExcluido' 'Fora do escopo (um por linha)' 'Note'
Campo $L 'Premissas' 'Premissas (uma por linha)' 'Note'
Campo $L 'Dependencias' 'Dependências (uma por linha)' 'Note'
Campo $L 'Restricoes' 'Restrições (uma por linha)' 'Note'
Campo $L 'Equipe' 'Equipe (Nome | Função | Empresa | Email)' 'Note'

# ------------------------------------------------------------ Portal Atividades
$L = 'Portal Atividades'; Lista $L 'Lists/PortalAtividades'; Titulo $L 'Atividade'
Projeto $L
Campo $L 'Codigo' 'Código' 'Text'
Campo $L 'Fase' 'Fase' 'Choice' $FASES
Campo $L 'Equipe' 'Equipe' 'Text'
Campo $L 'Duracao' 'Duração (dias úteis)' 'Number'
CampoData $L 'DataInicio' 'Início previsto'
CampoData $L 'DataTermino' 'Término previsto'
CampoData $L 'DataBaselineInicio' 'Início baseline'
CampoData $L 'DataBaselineTermino' 'Término baseline'
Campo $L 'Status' 'Status' 'Choice' @('Planejado', 'Em andamento', 'Bloqueado', 'Concluído', 'Cancelado')
Campo $L 'Percentual' '% concluído' 'Number'
Campo $L 'Marco' 'Marco' 'Boolean'
Campo $L 'AtividadePai' 'Atividade pai (código)' 'Text'
Campo $L 'Descricao' 'Descrição' 'Note'
Campo $L 'Observacao' 'Observação' 'Note'
# v3.19: reunião do Teams ligada à atividade
Campo $L 'ReuniaoTeams' 'Reunião do Teams (link)' 'Note'
Campo $L 'ReuniaoInicio' 'Reunião · início' 'Text'
Campo $L 'ReuniaoId' 'Reunião · ID do evento' 'Text'
Campo $L 'ReuniaoTipo' 'Reunião · tipo' 'Text'
# v3.33: responsável e atualização semanal
Campo $L 'ResponsavelEmail' 'Responsável (e-mail)' 'Text'
CampoData $L 'DataReal' 'Data real'
Campo $L 'DependeRDM' 'Depende de RDM' 'Boolean'
Campo $L 'NumeroRDM' 'Nº da RDM' 'Text'
Campo $L 'Impedimento' 'Impedimento' 'Boolean'
Campo $L 'CausaAtraso' 'Causa do atraso' 'Choice' @('Cliente / acesso', 'Fabricante / entrega', 'Janela / RDM', 'Recurso interno', 'Técnica')
Campo $L 'HorasRealizadas' 'Horas realizadas' 'Number'
CampoData $L 'DataUltimaAtualizacao' 'Última atualização'
Campo $L 'AtualizadoPor' 'Atualizado por' 'Text'
# status "A confirmar" na lista de opções
try { Atualizar-Opcoes $L 'Status' @('Planejado', 'Em andamento', 'Bloqueado', 'A confirmar', 'Concluído', 'Cancelado') } catch { Write-Warning "Opções de Status não atualizadas: $($_.Exception.Message)" }

# ------------------------------------------------------------ Portal Riscos
$L = 'Portal Riscos'; Lista $L 'Lists/PortalRiscos'; Titulo $L 'Risco'
Projeto $L
Campo $L 'Codigo' 'ID' 'Text'
Campo $L 'ImpactoProjeto' 'Impacto no projeto' 'Note'
Campo $L 'Cenarios' 'Cenários' 'Text'
Campo $L 'Probabilidade' 'Probabilidade' 'Choice' @('Baixo', 'Médio', 'Alto')
Campo $L 'Impacto' 'Impacto' 'Choice' @('Baixo', 'Médio', 'Alto')
Campo $L 'Mitigacao' 'Mitigação' 'Note'
Campo $L 'Contingencia' 'Contingência' 'Note'
Campo $L 'Responsavel' 'Responsável' 'Text'
Campo $L 'Situacao' 'Situação' 'Choice' @('Aberto', 'Em tratamento', 'Mitigado', 'Fechado')

# ------------------------------------------------------------ Portal Pendencias
$L = 'Portal Pendencias'; Lista $L 'Lists/PortalPendencias'; Titulo $L 'Pendência'
Projeto $L
Campo $L 'Codigo' 'ID' 'Text'
Campo $L 'Detalhe' 'Detalhamento' 'Note'
Campo $L 'Impacto' 'Impacto' 'Note'
Campo $L 'Situacao' 'Situação' 'Choice' @('Aberta', 'Respondida')
Campo $L 'Resposta' 'Resposta do cliente' 'Note'

# ------------------------------------------------------------ Portal Gates
# O título NÃO pode se chamar "Gate": o PnP acharia que a coluna interna Gate já existe (bug da v1/v2 do script).
$L = 'Portal Gates'; Lista $L 'Lists/PortalGates'; Titulo $L 'Nome do gate'
Projeto $L
Campo $L 'Fase' 'Fase' 'Choice' $FASES
Campo $L 'Gate' 'Código do gate' 'Text'
Campo $L 'Situacao' 'Situação' 'Choice' @('Pendente', 'Aguardando aprovação', 'Aprovado')
CampoData $L 'DataPrevista' 'Data prevista'
Campo $L 'Info' 'Critério / informação' 'Note'
Campo $L 'AprovadoPor' 'Aprovado por' 'Text'
CampoData $L 'DataAprovacao' 'Data da aprovação'
Campo $L 'Parecer' 'Parecer do PMO' 'Note'

# Reparo: gates gravados sem o código G1..G4 recebem o código pela fase
$GATES = @{ 'Iniciação' = @('G1', 'G1 · Termo de abertura aprovado'); 'Planejamento' = @('G2', 'G2 · Linha de base aprovada');
            'Execução' = @('G3', 'G3 · Execução aceita (libera monitoramento e encerramento)'); 'Encerramento' = @('G4', 'G4 · Termo de aceite final') }
$reparados = 0
foreach ($it in (Get-PnPListItem -List $L -PageSize 500)) {
  $fase = [string]$it['Fase']
  if (-not $it['Gate'] -and $GATES.ContainsKey($fase)) {
    $v = @{ Gate = $GATES[$fase][0] }
    if (-not $it['Title'] -or ([string]$it['Title']) -match '^G\d$') { $v.Title = $GATES[$fase][1] }
    Set-PnPListItem -List $L -Identity $it.Id -Values $v | Out-Null
    $reparados++
  }
}
if ($reparados) { Write-Host "$reparados gate(s) reparado(s) com o código G1..G4." -ForegroundColor Green }

# Gates repetidos (mesmo projeto + mesmo gate): lista e, com -LimparGatesDuplicados, remove os extras
$pesoSit = @{ 'Aprovado' = 3; 'Aguardando aprovação' = 2; 'Pendente' = 1 }
$grupos = @(Get-PnPListItem -List $L -PageSize 500) | Where-Object { $_['Projeto'] } |
  Group-Object { "$($_['Projeto'].LookupId)|$(if ($_['Gate']) { $_['Gate'] } elseif ($GATES.ContainsKey([string]$_['Fase'])) { $GATES[[string]$_['Fase']][0] } else { $_['Fase'] })" } | Where-Object { $_.Count -gt 1 }
$extras = 0
foreach ($gr in $grupos) {
  $ordenados = $gr.Group | Sort-Object @{ Expression = { $pesoSit[[string]$_['Situacao']] }; Descending = $true }, @{ Expression = { $_.Id }; Descending = $false }
  $manter = $ordenados[0]
  foreach ($dup in ($ordenados | Select-Object -Skip 1)) {
    $extras++
    if ($LimparGatesDuplicados) {
      Remove-PnPListItem -List $L -Identity $dup.Id -Force | Out-Null
      Write-Host "  removido gate repetido: projeto $($manter['Projeto'].LookupValue) · $($dup['Gate']) (item $($dup.Id)); mantido item $($manter.Id)" -ForegroundColor Yellow
    }
  }
}
if ($extras -and -not $LimparGatesDuplicados) { Write-Host "$extras gate(s) repetido(s) encontrado(s). Rode de novo com -LimparGatesDuplicados para remover." -ForegroundColor Yellow }
elseif (-not $extras) { Write-Host 'Nenhum gate repetido.' -ForegroundColor DarkGray }

# Todo projeto precisa dos gates G1..G4: cria os que faltarem (situação coerente com a fase atual)
$ORDEMF = @('Iniciação', 'Planejamento', 'Execução', 'Monitoramento', 'Encerramento')
$gatesExistentes = @(Get-PnPListItem -List $L -PageSize 500)
$criados = 0
foreach ($proj in (Get-PnPListItem -List 'Portal Projetos' -PageSize 500)) {
  $idProj = $proj.Id
  # Monitoramento corre junto com o Encerramento
  $faseAtual = [string]$proj['Fase']; if ($faseAtual -eq 'Monitoramento') { $faseAtual = 'Encerramento' }
  $idxAtual = [array]::IndexOf($ORDEMF, $faseAtual)
  $situacaoProj = [string]$proj['Situacao']
  foreach ($f in @('Iniciação', 'Planejamento', 'Execução', 'Encerramento')) {
    $cod = $GATES[$f][0]
    $existe = $gatesExistentes | Where-Object {
      $_['Projeto'] -and $_['Projeto'].LookupId -eq $idProj -and (([string]$_['Gate']) -eq $cod -or ((-not $_['Gate']) -and ([string]$_['Fase']) -eq $f))
    }
    if ($existe) { continue }
    if ($situacaoProj -eq 'Encerrado' -or [array]::IndexOf($ORDEMF, $f) -lt $idxAtual) { $sit = 'Aprovado' }
    elseif ($f -eq 'Iniciação' -and $situacaoProj -eq 'Em aprovação') { $sit = 'Aguardando aprovação' }
    else { $sit = 'Pendente' }
    Add-PnPListItem -List $L -Values @{ Title = $GATES[$f][1]; Projeto = $idProj; Fase = $f; Gate = $cod; Situacao = $sit } | Out-Null
    $criados++
  }
}
if ($criados) { Write-Host "$criados gate(s) criado(s) para projetos que não tinham G1..G4." -ForegroundColor Green }
else { Write-Host 'Todos os projetos já têm os gates G1..G4.' -ForegroundColor DarkGray }

# Visão "Por projeto": a lista é uma só para todos os projetos; cada projeto tem seus G1..G4
if (-not (Get-PnPView -List $L -Identity 'Por projeto' -ErrorAction SilentlyContinue)) {
  Add-PnPView -List $L -Title 'Por projeto' -Fields 'Gate', 'Title', 'Fase', 'Situacao', 'DataPrevista', 'AprovadoPor', 'DataAprovacao' `
    -Query "<GroupBy Collapse='FALSE'><FieldRef Name='Projeto' /></GroupBy><OrderBy><FieldRef Name='Gate' /></OrderBy>" -SetAsDefault | Out-Null
  Write-Host "Visão 'Por projeto' criada em Portal Gates (agrupa os G1..G4 de cada projeto)." -ForegroundColor Green
}

# ------------------------------------------------------------ Portal Decisoes
$L = 'Portal Decisoes'; Lista $L 'Lists/PortalDecisoes'; Titulo $L 'Decisão'
Projeto $L
Campo $L 'Codigo' 'ID' 'Text'
Campo $L 'Descricao' 'Descrição' 'Note'
Campo $L 'Justificativa' 'Justificativa' 'Note'
Campo $L 'Impacto' 'Impacto / observação' 'Note'

# ------------------------------------------------------------ Portal Tecnicos (tabela de técnicos da Systech)
$L = 'Portal Tecnicos'; Lista $L 'Lists/PortalTecnicos'; Titulo $L 'Nome'
Campo $L 'Email' 'E-mail' 'Text'
Campo $L 'Funcao' 'Função' 'Choice' @('Técnico', 'Arquiteto', 'Gerente de projeto')
Campo $L 'Ativo' 'Ativo' 'Boolean'
# cadastro inicial: inclui só quem ainda não está na lista (compara pelo e-mail)
$TECNICOS = @(
  @{ Nome = 'Guilherme Santos'; Email = 'guilherme.santos@systech.com.br' },
  @{ Nome = 'Felipe Cunha';     Email = 'felipe.cunha@systechtecnologia.com.br' },
  @{ Nome = 'Mario Junior';     Email = 'mario.junior@systechtecnologia.com.br' },
  @{ Nome = 'Leonardo Costa';   Email = 'leonardo.costa@systechtecnologia.com.br' }
)
$jaCadastrados = @(Get-PnPListItem -List $L -PageSize 500 | ForEach-Object { ([string]$_['Email']).Trim().ToLower() })
foreach ($t in $TECNICOS) {
  if ($jaCadastrados -contains $t.Email.ToLower()) { continue }
  Add-PnPListItem -List $L -Values @{ Title = $t.Nome; Email = $t.Email; Funcao = 'Técnico'; Ativo = $true } | Out-Null
  Write-Host "  técnico cadastrado: $($t.Nome) <$($t.Email)>" -ForegroundColor Green
}

# ------------------------------------------------------------ biblioteca de documentos
Lista $BIB 'DocumentosProjetos' 'DocumentLibrary'
Write-Host 'Estrutura pronta.' -ForegroundColor Green

if (-not $Piloto) { return }

# ------------------------------------------------------------ dados do piloto TRF1
$json = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'piloto-trf1.json') | ConvertFrom-Json
$D = { param($s) if ($s) { [datetime]::ParseExact($s, 'yyyy-MM-dd', $null).AddHours(12) } else { $null } }
$J = { param($a) if ($a) { ($a -join "`n") } else { '' } }

foreach ($p in $json.projetos) {
  $existe = Get-PnPListItem -List 'Portal Projetos' -Query "<View><Query><Where><Eq><FieldRef Name='Codigo'/><Value Type='Text'>$($p.codigo)</Value></Eq></Where></Query></View>"
  if ($existe) { Write-Host "Projeto $($p.codigo) já existe; dados do piloto não reinseridos." -ForegroundColor Yellow; continue }
  Write-Host "Inserindo $($p.codigo)..." -ForegroundColor Cyan
  $equipe = ($p.equipe | ForEach-Object { "$($_.nome) | $($_.funcao) | $($_.empresa) | $($_.email)" }) -join "`n"
  $item = Add-PnPListItem -List 'Portal Projetos' -Values @{
    Title = $p.nome; Codigo = $p.codigo; Cliente = $p.cliente; TipoProjeto = $p.tipo; Fase = $p.fase; Farol = $p.farol; Situacao = $p.situacaoCadastro
    Gerente = $p.gerente; Arquiteto = $p.arquiteto; Patrocinador = $p.patrocinador; Contrato = $p.contrato
    DataInicio = (& $D $p.inicio); DataTerminoBaseline = (& $D $p.terminoBaseline); DataTerminoPrevista = (& $D $p.terminoPrevisto)
    Objetivo = $p.objetivo; EscopoIncluido = (& $J $p.escopoIncluido); EscopoExcluido = (& $J $p.escopoExcluido)
    Premissas = (& $J $p.premissas); Dependencias = (& $J $p.dependencias); Restricoes = (& $J $p.restricoes); Equipe = $equipe
  }
  $id = $item.Id; $c = $p.codigo

  foreach ($a in $json.atividades.$c) {
    $v = @{ Title = $a.nome; Projeto = $id; Codigo = $a.codigo; Fase = $a.fase; Equipe = $a.equipe; Duracao = $a.duracao
      DataInicio = (& $D $a.inicio); DataTermino = (& $D $a.termino); DataBaselineInicio = (& $D $a.baselineInicio); DataBaselineTermino = (& $D $a.baselineTermino)
      Status = $a.status; Percentual = $a.percentual; Marco = [bool]$a.marco; AtividadePai = $a.pai; Descricao = $a.descricao; Observacao = $a.observacao }
    Add-PnPListItem -List 'Portal Atividades' -Values $v | Out-Null
  }
  foreach ($r in $json.riscos.$c) {
    Add-PnPListItem -List 'Portal Riscos' -Values @{ Title = $r.descricao; Projeto = $id; Codigo = $r.codigo; ImpactoProjeto = $r.impactoProjeto; Cenarios = $r.cenarios
      Probabilidade = $r.probabilidade; Impacto = $r.impacto; Mitigacao = $r.mitigacao; Contingencia = $r.contingencia; Responsavel = $r.responsavel; Situacao = $r.situacao } | Out-Null
  }
  foreach ($x in $json.pendencias.$c) {
    Add-PnPListItem -List 'Portal Pendencias' -Values @{ Title = $x.pergunta; Projeto = $id; Codigo = $x.codigo; Detalhe = $x.detalhe; Impacto = $x.impacto; Situacao = $x.situacao } | Out-Null
  }
  foreach ($x in $json.decisoes.$c) {
    Add-PnPListItem -List 'Portal Decisoes' -Values @{ Title = $x.decisao; Projeto = $id; Codigo = $x.codigo; Descricao = $x.descricao; Justificativa = $x.justificativa; Impacto = $x.impacto } | Out-Null
  }
  foreach ($g in ($p.fases | Where-Object { $_.gate })) {
    Add-PnPListItem -List 'Portal Gates' -Values @{ Title = $g.nome; Projeto = $id; Fase = $g.fase; Gate = $g.gate; Situacao = $g.situacao; DataPrevista = (& $D $g.data); Info = $g.info } | Out-Null
  }
  foreach ($pasta in $PASTAS) { Resolve-PnPFolder -SiteRelativePath "DocumentosProjetos/$c/$pasta" | Out-Null }
}

if ($ArquivoDesignBuild) {
  Add-PnPFile -Path $ArquivoDesignBuild -Folder "DocumentosProjetos/TRF1-VCF/02 · Planejamento" | Out-Null
  Write-Host 'Design & Build enviado para TRF1-VCF/02 · Planejamento.' -ForegroundColor Green
}
Write-Host 'Piloto TRF1 inserido.' -ForegroundColor Green
