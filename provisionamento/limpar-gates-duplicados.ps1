<#
.SYNOPSIS
  Mostra todos os itens da lista Portal Gates e remove os repetidos (mesmo projeto + mesmo gate).

.EXEMPLOS
  # só mostra (não apaga nada)
  .\limpar-gates-duplicados.ps1 -SiteUrl "https://gruposystech.sharepoint.com/sites/TesteProjetos" -ClientId "<id do app PnP>"

  # remove os repetidos, mantendo um gate de cada (o mais avançado; no empate, o mais antigo)
  .\limpar-gates-duplicados.ps1 -SiteUrl "https://gruposystech.sharepoint.com/sites/TesteProjetos" -ClientId "<id do app PnP>" -Remover
#>
param(
  [Parameter(Mandatory = $true)] [string] $SiteUrl,
  [Parameter(Mandatory = $true)] [string] $ClientId,
  [switch] $Remover
)
$ErrorActionPreference = 'Stop'
Import-Module PnP.PowerShell
Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId

# o código do gate é deduzido pela fase quando a coluna Gate está vazia
$GATE_DA_FASE = @{ 'Iniciação' = 'G1'; 'Planejamento' = 'G2'; 'Execução' = 'G3'; 'Monitoramento' = 'G3'; 'Encerramento' = 'G4' }
$PESO = @{ 'Aprovado' = 3; 'Aguardando aprovação' = 2; 'Pendente' = 1 }

$linhas = foreach ($it in (Get-PnPListItem -List 'Portal Gates' -PageSize 500)) {
  $proj = $it['Projeto']
  $codigo = [string]$it['Gate']
  if (-not $codigo) { $codigo = $GATE_DA_FASE[[string]$it['Fase']] }
  [pscustomobject]@{
    Id        = $it.Id
    ProjetoId = if ($proj) { $proj.LookupId } else { 0 }
    Projeto   = if ($proj) { $proj.LookupValue } else { '(sem projeto)' }
    Gate      = $codigo
    Fase      = [string]$it['Fase']
    Situacao  = [string]$it['Situacao']
    Titulo    = [string]$it['Title']
  }
}

Write-Host "`nItens em Portal Gates: $(@($linhas).Count)" -ForegroundColor Cyan
$linhas | Sort-Object Projeto, Gate, Id | Format-Table Id, Projeto, Gate, Fase, Situacao, Titulo -AutoSize | Out-String -Width 220 | Write-Host

$semProjeto = @($linhas | Where-Object { -not $_.ProjetoId })
if ($semProjeto.Count) {
  Write-Host "$($semProjeto.Count) gate(s) sem projeto (o portal ignora). IDs: $($semProjeto.Id -join ', ')" -ForegroundColor Yellow
}

$repetidos = @()
foreach ($grupo in ($linhas | Where-Object { $_.ProjetoId } | Group-Object ProjetoId, Gate | Where-Object { $_.Count -gt 1 })) {
  $ordenados = @($grupo.Group | Sort-Object @{ Expression = { $PESO[$_.Situacao] }; Descending = $true }, @{ Expression = { $_.Id }; Descending = $false })
  $manter = $ordenados[0]
  foreach ($dup in ($ordenados | Select-Object -Skip 1)) {
    $repetidos += [pscustomobject]@{ Remover = $dup.Id; Manter = $manter.Id; Projeto = $dup.Projeto; Gate = $dup.Gate; Situacao = $dup.Situacao }
  }
}

if (-not $repetidos.Count) { Write-Host 'Nenhum gate repetido: cada projeto tem um G1, um G2, um G3 e um G4.' -ForegroundColor Green; return }

Write-Host "$($repetidos.Count) gate(s) repetido(s):" -ForegroundColor Yellow
$repetidos | Format-Table Projeto, Gate, Situacao, Remover, Manter -AutoSize | Out-String -Width 220 | Write-Host

if (-not $Remover) { Write-Host 'Nada foi apagado. Rode de novo com -Remover para apagar os itens da coluna "Remover".' -ForegroundColor Yellow; return }

foreach ($r in $repetidos) {
  Remove-PnPListItem -List 'Portal Gates' -Identity $r.Remover -Force | Out-Null
  Write-Host "  removido item $($r.Remover) ($($r.Projeto) · $($r.Gate)); mantido item $($r.Manter)" -ForegroundColor Green
}
Write-Host 'Limpeza concluída.' -ForegroundColor Green
