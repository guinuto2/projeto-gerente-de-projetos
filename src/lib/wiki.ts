/**
 * Conteúdo da Wiki do técnico: documentos (qualificação técnica e modelos de questionamento) e fabricantes.
 * Os links dos fabricantes são FICTÍCIOS (domínio reservado example.com) — troque pelos endereços oficiais quando quiser.
 */
export interface Modelo { id: string; titulo: string; descricao: string; secoes: { titulo: string; itens: string[] }[] }
export interface Site { titulo: string; descricao: string; url: string }
export interface Fabricante { id: string; nome: string; sigla: string; cor: string; descricao: string; sites: Site[]; dicas: string[] }

export const MODELOS: Modelo[] = [
  { id: 'qualificacao-vmware', titulo: 'VMware - qualificações e questionamentos',
    descricao: 'Qualificação técnica exigida em editais VMware (credenciamento, certificações, gerente PMP, treinamento) e modelos de questionamentos.',
    secoes: [
      { titulo: 'Credenciamento junto ao fabricante', itens: [
        'A CONTRATADA deverá comprovar ser um canal credenciado Broadcom VMware, conforme declarado no site oficial do fabricante ou mediante declaração emitida diretamente pelo fabricante;',
        'Para a entrega dos serviços, a CONTRATADA deverá ser credenciada e certificada pelo fabricante como parceiro de consultoria e serviços. Essa condição deverá ser devidamente comprovada através do site oficial do fabricante: https://expert.broadcom.com/;',
        'A exigência deve-se à prática comercial adotada pelos grandes fabricantes de soluções de tecnologia que não comercializam diretamente seus produtos. Tais fabricantes realizam essa comercialização por meio de empresas credenciadas, que obedecem a uma série de requisitos e certificações para se manterem no programa de parceiros. Com isso, o fabricante garante que os serviços ofertados pelos parceiros respeitam um padrão mínimo de qualidade, garantindo ou pelo menos minimizando os riscos à sua imagem.'
      ] },
      { titulo: 'Quadro de profissionais', itens: [
        'A contratada deverá possuir em seu quadro de profissionais os seguintes itens:',
        '• Dois (02) consultores certificados VMware Certified Professional - VMware Cloud Foundation - Architect (2025 ou posterior);',
        '• Dois (02) consultores certificados VMware Certified Professional - VMware Cloud Foundation - Administrator (2025 ou posterior);',
        '• Um (01) consultor certificado VMware Certified Professional - VMware Cloud Foundation - Support (2025 ou superior);',
        '• Dois (02) consultores certificados VMware Certified Advanced Professional - VMware Cloud Foundation - Networking (2025 ou posterior);',
        '• Um (01) consultor certificado Broadcom Partner Certification - Broadcom Knight.'
      ] },
      { titulo: 'Gerente de projeto', itens: [
        'Será de responsabilidade da CONTRATADA a disponibilização de profissional responsável pelo gerenciamento e acompanhamento de todo o ciclo de desenvolvimento e entrega do(s) objeto(s) desta contratação, onde deverá ser comprovado que este profissional é possuidor da certificação PMP (Project Management Professional) emitida pelo Project Management Institute (PMI) e enviado juntamente com a documentação na fase de habilitação, esta medida visa assegurar a aplicação das melhores práticas em gestão de projetos ou certificação similar.'
      ] },
      { titulo: 'Documentação', itens: [
        'A documentação de qualificação técnica deverá ser enviada juntamente com a proposta na fase de habilitação.'
      ] },
      { titulo: 'Requisitos de treinamento / capacitação / repasse de conhecimento', itens: [
        'Deverá ser fornecido, anualmente, acesso para evento anual de atualização tecnológica e apresentação de roadmaps oficiais da fabricante Dell EMC, em território internacional (preferencialmente) ou nacional, para ao menos 2 (dois) integrantes do CONTRATANTE durante a vigência do suporte do contrato do item 1 (60 meses).'
      ] },
      { titulo: 'Modelo de questionamento — Qualificação como Expert (Q2)', itens: [
        'Conforme o item 2.3.1.1.1 do Termo de Referência, é informado que “A CONTRATADA deverá realizar ações voltadas à melhoria contínua do ambiente onde o VMware Cloud Foundation e o VMware vSphere Foundation estão implantados, promovendo a otimização da infraestrutura existente e identificando oportunidades de aprimoramento dos softwares instalados, utilizando as ferramentas recomendadas pelo fabricante.”.',
        'Com relação à qualificação da CONTRATADA, o Edital também exige que a licitante:',
        '• 8.6.1.3 A licitante tenha prestado serviço cujo objeto do contrato seja de fornecimento e/ou suporte aos softwares VMware Cloud Foundation ou VMware vSphere Foundation, nas versões indicadas, executados em instituições financeiras ou para a Administração Pública"',
        '• 8.6.1.4 A Licitante deve apresentar declaração do fabricante informando que é revenda autorizada da fabricante VMWare by Broadcom e que faz parte do programa de parceria do fabricante.',
        'Diante dessas exigências, entendemos que, para assegurar a execução eficaz das ações de melhoria contínua e da otimização da infraestrutura, a Contratada deve ser uma empresa devidamente credenciada como parceira de serviços Broadcom, com autorização formal para atuar sobre os softwares VMware. Tal requisito representa uma medida de proteção ao erário público, garantindo que os fornecedores com legitimidade e competência reconhecida pelo fabricante executem os serviços exigidos por essa contratação, capazes de seguir as melhores práticas de implementação e configuração dos produtos impostas pelo fabricante, aumentando a eficiência e reduzindo riscos de problemas ao ambiente o que pode acarretar prejuízo financeiro, uma vez que essa parceria oficial com a Broadcom assegura não apenas suporte adequado, mas também que as ações de melhoria contínua sejam realizadas com as ferramentas recomendadas pelo fabricante, em conformidade com suas políticas de suporte e otimização.',
        'Está correto nosso entendimento?'
      ] },
      { titulo: 'Modelo de questionamento — Suporte técnico em português · Modelo 01 (Q1)', itens: [
        'Conforme leitura do Termo de Referência, é informado no item 5.3 que devemos “Garantir a disponibilidade técnica e o atendimento dos serviços de suporte em regime 24x7, para todo o conjunto de serviços que faz parte do escopo contratado e para os produtos, via suporte telefônico, ou por meio eletrônico, no idioma português ou espanhol, sem limites de acionamentos e devendo responder aos requisitos dos níveis de serviço especificados: A) Severidade 1: 04 horas; B) Severidade 2: 08 horas; C) Severidade 3: 12 horas; D) Severidade 4: 12 horas.”',
        'Considerando que o suporte e a garantia da solução ofertada são prestados exclusivamente pelo fabricante, por meio de seus canais oficiais de atendimento e seu modelo de suporte global, em idioma inglês, conforme documentação oficial do fabricante (https://docs.broadcom.com/doc/broadcom-maintenance-policy-handbook), entendemos que será aceito este formato pela PROCEMPA, uma vez que esse modelo e SLA de suporte global não possui possibilidade de alteração. Está correto o nosso entendimento?'
      ] },
      { titulo: 'Modelo de questionamento — Suporte técnico em português · Modelo 02 (Q1)', itens: [
        'Conforme análise do Termo de Referência, é informado no item 12.2.1.2 que “Os serviços de manutenção de licenças e suporte técnico de software deverão ser prestados diretamente pela fabricante, através de e-mail, telefone ou website;”.',
        'Ainda em leitura dos itens subsequentes, é informado no item H que:',
        'h) O atendimento do suporte técnico deverá ser oferecido em idioma português. Fora do horário comercial, o atendimento poderá ser em inglês.',
        'Considerando que o suporte técnico e a garantia dos produtos da solução ofertada são prestados pelo fabricante por meio de seus canais oficiais, seguindo seu modelo global de atendimento e as condições estabelecidas em sua política oficial de suporte e manutenção, disponível (em: https://docs.broadcom.com/doc/broadcom-maintenance-policy-handbook), e que tais condições são padronizadas pelo fabricante e não podem ser alteradas pela CONTRATADA, entendemos que será aceito o modelo oficial de suporte disponibilizado pelo fabricante, inclusive quanto ao idioma e aos respectivos níveis de atendimento que estão condizentes com os SLAs solicitados no edital e seus anexos.',
        'Está correto o nosso entendimento?'
      ] },
      { titulo: 'Modelo de questionamento quanto à subcontratação — Esclarecimento 09 (Composição da Equipe Técnica)', itens: [
        'Considerando que a responsabilidade pela execução contratual permanecerá integralmente sob a contratada, inclusive quanto ao atendimento de todas as exigências técnicas, prazos, níveis de serviço e demais obrigações previstas no Edital, Termo de Referência e respectivos anexos, entendemos que a composição da equipe técnica poderá contemplar profissionais com diferentes naturezas de vínculo jurídico com a contratada, desde que todos atendam às qualificações técnicas, certificações, experiências e demais requisitos exigidos no certame.',
        'Dessa forma, entendemos que a participação de profissionais contratados pela licitante, independentemente da modalidade de vínculo mantida com esta, é admitida para a execução dos serviços especializados, permanecendo a contratada como única e integral responsável perante a Administração pela execução do objeto contratual.',
        'Está correto o entendimento?'
      ] }
    ] },
  { id: 'qualificacao-servidores', titulo: 'Qualificações servidores Dell + HPE + Lenovo',
    descricao: 'Requisitos técnicos para servidores (BIOS/segurança, gerenciamento, sistemas operacionais, NVIDIA) que favorecem Dell, HPE e Lenovo.',
    secoes: [
      { titulo: 'BIOS/Segurança', itens: [
        '• Deve possuir funcionalidade que permita que os discos locais do servidor sejam apagados de forma definitiva através de tecnologia de regravação de dados ou similar. Esta funcionalidade deve possibilitar que sejam definitivamente apagados quaisquer disco dentro do servidor, suportando, no mínimo dispositivos de memória não volátil (SSDs e NVMe);',
        '• O fabricante deverá constar na lista pública do TSAnet em nível Elite , confirmado por meio de consulta ao site https://tsanet.org/members/; - Dell, HPE, Lenovo e Huawei',
        '• O fabricante deve estar listado como membro do FIRST, confirmado por meio de consulta ao site https://www.first.org/members/map - Dell, HPE e Lenovo',
        '• O fabricante deve estar listado como membro do TCG (Trusted Computing Group), confirmado por meio de consulta ao site https://trustedcomputinggroup.org/membership/member-companies/ - Dell, HPE, Lenovo, Positivo, Supermicro e Huawei',
        '• O fabricante deve estar listado como membro do CVE Program, confirmado por meio de consulta ao site https://www.cve.org/PartnerInformation/ListofPartners; - Dell, HPE, Lenovo, Positivo, Supermicro e Huawei',
        '• O fabricante do servidor deverá estar catalogado na categoria “Promoters” do conselho UEFI (https://uefi.org/members); - Dell, HPE e Lenovo',
        '• Deverá ser capaz de ser gerenciado através de “Redfish API”, seguindo a padronização da Organização Distributed Management Task Force (DMTF);',
        '• A empresa desenvolvedora do equipamento deverá fazer parte do Board do DMTF (http://dmtf.org/about/list).  - Dell, HPE, Lenovo, Positivo, Supermicro e Huawei'
      ] },
      { titulo: 'Gerenciamento', itens: [
        '• Permitir habilitar autenticação utilizando, pelo menos, dois fatores de autenticação (2FA) para acesso à controladora de gerenciamento',
        '• A controladora de gerenciamento do servidor deverá permitir operar em modo de segurança padrão FIPS 140-2 ou versão superior, permitindo habilitar/desabilitar o recurso. Esses requisitos devem ser comprovados através de documentação técnica do fabricante.',
        '• Deve possuir funcionalidade que permita que os discos locais do servidor sejam apagados de forma definitiva através de tecnologia de regravação de dados ou similar. Esta funcionalidade deve possibilitar que sejam definitivamente apagados quaisquer disco dentro do servidor, suportando, no mínimo dispositivos de memória não volátil (SSDs e NVMe);'
      ] },
      { titulo: 'Compatibilidade com Sistema Operacional', itens: [
        '• O servidor deverá ser ofertado SEM sistema operacional;',
        '• O modelo do servidor ofertado deve estar certificado para o sistema operacional Windows Server 2025 x64 ou superior, comprovado através do Windows Server Catalog da Microsoft (https://www.windowsservercatalog.com/);',
        '• O modelo ofertado deve ser compatível com RedHat Enterprise Linux Server 9.0 ou superior (https://catalog.redhat.com/hardware/search?p=1);',
        '• O modelo do servidor ofertado deve apresentar compatibilidade comprovada para o sistema de virtualização VMware ESXi 9.0 ou posterior, comprovado através de Guia de Compatibilidade da VMware (https://www.vmware.com/resources/compatibility/search.php?deviceCategory=server);',
        '• O modelo ofertado deve ser compatível com Ubuntu 26.04 LTS ou superior e deverá constar na matriz do fabricante do software (https://ubuntu.com/certified/servers?q=&limit=20);',
        'Obs.: O item de UBUNTU 26.04 LTS elimina totalmente a concorrência com SuperMicro e xFusion e é hoje um sistema operacional utilizado amplamente, o que justifica a adição deste item. Esse item estava no edital do TRT4, que posteriormente removeu por conta da xFusion, mas que melhora nosso posicionamento.'
      ] },
      { titulo: 'Item para dispocionar xFusion com certificações NVIDIA', itens: [
        '• O modelo de servidor ofertado deverá possuir compatibilidade previamente validada para utilização de aceleradores computacionais NVIDIA, de forma a permitir futura expansão da plataforma para aplicações de Inteligência Artificial (IA), Machine Learning (ML) e Computação de Alto Desempenho (HPC).',
        'Obs.: Usar quando o servidor não tem GPU e precisar vir preparado para GPU, para tirar a xFusion.',
        '• O modelo de servidor ofertado deverá possuir compatibilidade previamente validada para utilização de aceleradores computacionais NVIDIA, para utilização da plataforma para aplicações de Inteligência Artificial (IA), Machine Learning (ML) e Computação de Alto Desempenho (HPC).',
        '• Para comprovação do atendimento ao item anterior, o modelo do servidor ofertado deverá constar no catálogo oficial NVIDIA Qualified System Catalog (https://marketplace.nvidia.com/en-us/enterprise/qualified-system-catalog/), disponível publicamente no site do fabricante, devendo estar classificado no campo “NVIDIA Cert. Type” como “NVIDIA-Certified” ou “Qualified”.',
        '• A comprovação deverá permitir a identificação do fabricante e do modelo do servidor ofertado no referido catálogo, bem como sua respectiva classificação como “NVIDIA-Certified” ou “Qualified”.',
        '• Será aceita documentação ou programa oficial que venha a substituir o NVIDIA Qualified System Catalog, desde que mantido oficialmente pela NVIDIA e que permita comprovar a qualificação ou certificação da plataforma ofertada. (https://docs.nvidia.com/infra-controller/documentation/reference/hardware-compatibility-list)'
      ] },
      { titulo: 'Requisitos de treinamento / capacitação / repasse de conhecimento', itens: [
        'Deverá ser fornecido, anualmente, acesso para evento anual de atualização tecnológica e apresentação de roadmaps oficiais da fabricante Dell EMC, em território internacional (preferencialmente) ou nacional, para ao menos 2 (dois) integrantes do CONTRATANTE durante a vigência do suporte do contrato do item 1 (60 meses).'
      ] }
    ] },
  { id: 'questionamento-servidores', titulo: 'Questionamento servidores',
    descricao: 'Modelo de questionamento (Q6) sobre a aceitação de peças remanufaturadas pelo fabricante (OEM) na garantia.',
    secoes: [
      { titulo: 'Peças Novas e Usadas — Q6', itens: [
        'Conforme análise do Termo de Referência, o edital estabelece no item 7.3.5 que "As peças, componentes e outros materiais de reposição devem ser novos e originais do fabricante dos equipamentos, podendo o TRT exigir comprovação de sua procedência" e que, durante a execução da garantia, eventuais componentes defeituosos deverão ser substituídos por “peças novas, de primeiro uso e originais”. Entendemos que tal exigência possui a finalidade técnica de assegurar que a reposição preserve a confiabilidade, durabilidade, integridade funcional e desempenho adequado do equipamento originalmente fornecido.',
        'Considerando o avanço das políticas públicas de economia circular e sustentabilidade adotadas pelo Governo Federal — em especial a Estratégia Nacional de Economia Circular (ENEC), instituída pelo Decreto nº 12.082/2024, e o Plano Nacional de Economia Circular (PLANEC), aprovado pelo MDIC/SEV, que incentivam práticas de remanufatura, reaproveitamento de materiais, redução de resíduos e prolongamento do ciclo de vida de produtos — gostaríamos de solicitar esclarecimento quanto à interpretação da Comissão sobre a eventual aceitação de peças remanufaturadas pelo próprio fabricante (OEM) nos serviços de garantia.',
        'Esclarecemos que peças remanufaturadas OEM passam por processo industrial completo e controlado pelo fabricante, incluindo desmontagem integral, inspeção técnica, substituição sistemática de componentes sujeitos a desgaste por peças novas e originais, atualização de firmware quando aplicável, testes funcionais e de desempenho equivalentes aos aplicados em peças novas e emissão de documentação técnica que assegura rastreabilidade, conformidade e equivalência funcional.',
        'O processo acima descrito garante que peças remanufaturadas OEM apresentem desempenho, qualidade, confiabilidade e segurança equivalentes às peças novas, atendendo integralmente à finalidade técnica buscada pela exigência constante do edital.',
        'Adicionalmente, observa-se que a indústria global de tecnologia ainda enfrenta impactos decorrentes das oscilações na cadeia de suprimentos de componentes eletrônicos e semicondutores, situação que afeta a disponibilidade e os prazos de entrega de peças novas em diversos mercados. Nesse contexto, a utilização de peças remanufaturadas OEM certificadas pelo fabricante representa uma prática consolidada internacionalmente, permitindo a manutenção dos níveis de serviço contratados, a redução do tempo de indisponibilidade dos equipamentos e a continuidade operacional do ambiente, sem qualquer comprometimento da qualidade, desempenho ou confiabilidade da solução.',
        'Diante do exposto, solicitamos respeitosamente o esclarecimento da Comissão quanto ao seguinte ponto:',
        'Considerando-se que a finalidade da exigência editalícia é garantir a qualidade, confiabilidade, desempenho e originalidade dos componentes utilizados na execução da garantia, será admissível a utilização de peças remanufaturadas OEM, fornecidas e certificadas pelo próprio fabricante, devidamente rastreáveis e equivalentes, em desempenho, funcionalidade, confiabilidade e garantia, às peças novas, para fins de atendimento dos serviços de suporte técnico e garantia oficial do fabricante?'
      ] }
    ] },
  { id: 'live-optics', titulo: 'Coleta de dados Via Live Optics',
    descricao: 'Passo a passo da coleta de dados do vCenter com o Live Optics (Optical Prime), para envio do arquivo .SIOKIT à Systech.',
    secoes: [
      { titulo: 'Coleta de Dados Via Live Optics', itens: [
        '1. Efetue o download, extraia os arquivos e execute a aplicação do LiveOptics;',
        'URL: <<<<< ADICIONAR LINK ATUALIZADO DO LIVE OPTICS >>>>>',
        '2. Verifique se a conta está em nome de Systech Sistemas e Tecnologia e clique em “Sim, está correto”;',
        '3. Desmarque as caixas “Collector Update Validation” e “I would like to anonymously…” e clique em “Next”;',
        '4. Selecione a categoria “Server & Cloud”, clique em "Iniciar" em Optical Prime.',
        '5. Clique no botão "Próximo" para aceitar o padrão de conexão aos serviços da web Live Optics para enviar automaticamente seus resultados (altamente recomendado).',
        '6. Informe um nome para o projeto que será criado “ClienteXYZ-VCENTER” e clique em ”Próximo”;',
        'Obs.: Neste item verifiquei bem onde será armazenado o arquivo de logs da coleta (extensão: “.SIOKIT”);',
        '7. Clique em “Next”;',
        '8. Para adicionar o servidor vCenter ao Optical Prime, clique no botão "Add Remote Server" (aqui podem ser adicionados vários vCenters de uma única vez);',
        '9. Selecione "Connect to VMWare vCenter Server" e desmarque a caixa de subseleção para não incluir dados de desempenho das VM;',
        '10. Insira o endereço IP do servidor vCenter (isso pode ser testado inserindo o mesmo endereço IP em um navegador da web e verificando se ele abre a página do portal VMWare vSphere)',
        '11. Quando as credenciais de autenticação forem solicitadas, insira uma conta de administrador ou de nível raiz no servidor vCenter.',
        'NOTA : As credenciais do usuário usadas para fazer login do Optical Prime no vCenter devem ter, no mínimo, permissões somente leitura para o vCenter e receber acesso para usar a API vSphere Webservices. Além disso, a máquina de origem onde o Live Optics está em execução deve ser capaz de acessar o aplicativo cliente vCenter/vSphere.',
        '12. O Optical Prime começará a verificar o vCenter em busca de todos os hosts ESXi e armazenamentos de dados anexados a ele. Se uma tela de seleção de cluster do vCenter for exibida, clique em OK para continuar com o Optical Prime.',
        '13. Quando o Optical Prime concluir sua descoberta inicial, ajuste a duração da captura para 72 horas (Dropbox no canto inferior direito da tela da aplicação);',
        '14. O coletor Live Optics agora está em execução e coletando dados de desempenho de seus servidores.',
        '15. Assim que finalizado, efetue o envio do arquivo com extensão .SIOKIT para a Systech e-mail.'
      ] }
    ] },
  { id: 'disposicionar-dell', titulo: 'Disposicionar Dell',
    descricao: 'Requisitos que favorecem a Lenovo frente à Dell (Memory Tiering com RAID via software) e espaço para o caminho inverso.',
    secoes: [
      { titulo: 'Melhor para Lenovo - Disposiciona Dell', itens: [
        '## 1. Memory Tiering:',
        '1. Deve possuir 02 (dois) discos NVMe compatíveis com a funcionalidade de NVME MEMORY TIERING disponibilizada pelo VMware Cloud Foundation (VCF) 9, com no mínimo 1,6 TB cada um, do tipo uso misto.',
        '2. O equipamento deverá possuir controladora via software integrada ao processador para utilização de RAID1 com a funcionalidade de Memory Tiering. Os discos deverão ser do tipo Endurance Classe D, Performance Classe F ou superior e estarem listados na lista de compatibilidade da funcionalidade da VMware.',
        'Obs.: Neste item desposicionamos totalmente a Dell, pois ela não possui esse recurso em nenhum equipamento servidor que permita a entrega de RAID via software. A Dell não possui servidores com VROC.'
      ] },
      { titulo: 'Melhor para Dell - Disposiciona Lenovo', itens: [
        'Se acharem, coloque aqui, porque tá difícil achar…'
      ] }
    ] }
];

const ex = (fab: string, caminho: string) => `https://example.com/${fab}/${caminho}`;

export const FABRICANTES: Fabricante[] = [
  { id: 'dell', nome: 'Dell Technologies', sigla: 'DELL', cor: '#0076CE', descricao: 'Servidores PowerEdge, storage PowerStore/PowerVault/Unity e switches. Suporte por Service Tag.',
    sites: [
      { titulo: 'Suporte por Service Tag', descricao: 'Garantia, drivers e chamados a partir da etiqueta do equipamento.', url: ex('dell', 'suporte/service-tag') },
      { titulo: 'Drivers e downloads', descricao: 'Firmware, BIOS, iDRAC e pacotes de atualização.', url: ex('dell', 'drivers') },
      { titulo: 'Base de conhecimento', descricao: 'Artigos de solução de problemas e notas técnicas.', url: ex('dell', 'kb') },
      { titulo: 'Documentação PowerEdge', descricao: 'Manuais de instalação, guias de iDRAC e especificações.', url: ex('dell', 'docs/poweredge') },
      { titulo: 'Abertura de chamado', descricao: 'Portal de casos e envio de logs (SupportAssist).', url: ex('dell', 'chamados') }
    ],
    dicas: ['Antes de abrir chamado, colete o log do SupportAssist/TSR pelo iDRAC.', 'Atualize firmware em pacote (catálogo) para manter as versões compatíveis entre si.'] },
  { id: 'vmware', nome: 'VMware by Broadcom', sigla: 'VMW', cor: '#717074', descricao: 'vSphere, vCenter, VCF, NSX e vSAN. Licenças e downloads pelo portal do fabricante.',
    sites: [
      { titulo: 'Portal de suporte e downloads', descricao: 'Downloads de binários, patches e gerenciamento de licenças.', url: ex('vmware', 'portal') },
      { titulo: 'Guia de compatibilidade (HCL)', descricao: 'Hardware, drivers e firmware certificados por versão.', url: ex('vmware', 'compatibilidade') },
      { titulo: 'Matriz de interoperabilidade', descricao: 'Versões suportadas entre vCenter, ESXi, NSX, vSAN e VCF.', url: ex('vmware', 'interoperabilidade') },
      { titulo: 'Documentação técnica', descricao: 'Guias de instalação, upgrade e notas de versão.', url: ex('vmware', 'docs') },
      { titulo: 'Base de conhecimento (KB)', descricao: 'Artigos de erros conhecidos e soluções.', url: ex('vmware', 'kb') },
      { titulo: 'Ciclo de vida dos produtos', descricao: 'Datas de fim de suporte de cada versão.', url: ex('vmware', 'ciclo-de-vida') }
    ],
    dicas: ['Confira a matriz de interoperabilidade antes de qualquer upgrade de vCenter/ESXi.', 'Faça backup em arquivo do vCenter (VAMI) antes de patches.'] },
  { id: 'lenovo', nome: 'Lenovo Data Center', sigla: 'LNV', cor: '#E2231A', descricao: 'Servidores ThinkSystem e ThinkAgile, gerenciamento por XClarity.',
    sites: [
      { titulo: 'Suporte do data center', descricao: 'Garantia e chamados pelo número de série.', url: ex('lenovo', 'suporte') },
      { titulo: 'Drivers e firmware (UpdateXpress)', descricao: 'Pacotes de atualização e Best Recipes.', url: ex('lenovo', 'drivers') },
      { titulo: 'XClarity — documentação', descricao: 'Administrator, Controller (XCC) e Orchestrator.', url: ex('lenovo', 'xclarity') },
      { titulo: 'Lenovo Press', descricao: 'Guias de produto, especificações e referências.', url: ex('lenovo', 'press') }
    ],
    dicas: ['Use as "Best Recipes" para combinar firmware, drivers e versões de VMware.', 'Colete o FFDC pelo XCC antes de abrir chamado.'] },
  { id: 'omnissa', nome: 'Omnissa', sigla: 'OMN', cor: '#1F6FEB', descricao: 'Horizon (VDI), Workspace ONE e App Volumes — antiga divisão de End-User Computing.',
    sites: [
      { titulo: 'Portal do cliente', descricao: 'Downloads, licenças e chamados.', url: ex('omnissa', 'portal') },
      { titulo: 'Documentação Horizon', descricao: 'Instalação, arquitetura e upgrades.', url: ex('omnissa', 'docs/horizon') },
      { titulo: 'Matriz de interoperabilidade', descricao: 'Compatibilidade entre Horizon, agentes e vSphere.', url: ex('omnissa', 'interoperabilidade') },
      { titulo: 'Base de conhecimento', descricao: 'Artigos de solução de problemas.', url: ex('omnissa', 'kb') }
    ],
    dicas: ['Atualize Connection Server antes dos agentes nas VMs.', 'Teste a imagem dourada em pool de homologação antes de publicar.'] },
  { id: 'processadores', nome: 'Processadores', sigla: 'CPU', cor: '#6B4FBB', descricao: 'Intel Xeon e AMD EPYC: especificações, compatibilidade de gerações e microcódigo.',
    sites: [
      { titulo: 'Intel — especificações (ARK)', descricao: 'Núcleos, frequências, TDP e recursos de cada modelo.', url: ex('intel', 'ark') },
      { titulo: 'Intel — avisos de segurança', descricao: 'Vulnerabilidades e atualizações de microcódigo.', url: ex('intel', 'seguranca') },
      { titulo: 'AMD EPYC — especificações', descricao: 'Modelos, núcleos e plataformas suportadas.', url: ex('amd', 'epyc') },
      { titulo: 'AMD — avisos de segurança', descricao: 'Boletins e correções de firmware.', url: ex('amd', 'seguranca') },
      { titulo: 'Compatibilidade de EVC', descricao: 'Modos EVC por geração de CPU para migração de VMs.', url: ex('vmware', 'evc') }
    ],
    dicas: ['Misturar gerações no mesmo cluster exige ajustar o modo EVC.', 'Microcódigo vem no BIOS do servidor — atualize pelo pacote do fabricante.'] },
  { id: 'servidores', nome: 'Servidores', sigla: 'SRV', cor: '#2F855A', descricao: 'Referências gerais de hardware de servidor: compatibilidade, garantia e boas práticas.',
    sites: [
      { titulo: 'Dell PowerEdge — linha atual', descricao: 'Modelos, configurações e comparativos.', url: ex('dell', 'poweredge') },
      { titulo: 'Lenovo ThinkSystem — linha atual', descricao: 'Modelos e guias de produto.', url: ex('lenovo', 'thinksystem') },
      { titulo: 'HPE ProLiant — linha atual', descricao: 'Modelos, iLO e Service Pack for ProLiant.', url: ex('hpe', 'proliant') },
      { titulo: 'Calculadora de consumo e energia', descricao: 'Estimativa de potência e dissipação de calor.', url: ex('servidores', 'energia') }
    ],
    dicas: ['Registre número de série e garantia de cada servidor na documentação do projeto.', 'Valide a placa de rede e a controladora no guia de compatibilidade do VMware.'] }
];

/** Arquivos da pasta da equipe técnica (biblioteca "Wiki Tecnicos" no SharePoint; cópia junto do portal em /wiki/arquivos). */
export interface ArquivoWiki { nome: string; arquivo?: string; descricao: string; tamanho?: number; id?: string; url?: string; modificado?: string; local: boolean }
export const BIBLIOTECA_WIKI = 'Wiki Tecnicos';
export const DESCRICAO_ARQUIVO: Record<string, string> = {
  'Instruções TRELLO.pdf': 'Guia de uso do Trello pela área técnica: como registrar e acompanhar as análises.',
  'Instruções de resposta de E-mail para Análise de Edital.pdf': 'Como responder os e-mails de análise de edital sem restringir a competitividade do certame.',
  'Modelo-PaP.xlsx': 'Modelo de planilha ponto a ponto (PaP), com uma aba por item do edital.',
  'Resumo de Cotações - Servidores-HCI.xlsx': 'Resumo de cotações de servidores e HCI para comparação.',
  'Template SYSTECH - Apresentação para Clientes.pptx': 'Modelo de apresentação Systech para clientes (5 slides).',
  'Template de E-Mail.txt': 'Estrutura do e-mail de análise de edital: lotes e itens, questionamentos, atestados e declarações.',
  'Template de Sugestões para o corpo do E-mail.xlsx': 'Sugestões de texto prontas para o corpo do e-mail.',
  'Template de Sugestões.xlsx': 'Sugestões por tema (servidores, storage e backup), com exemplos.'
};
/** Nome do arquivo no disco (sem acento) → nome exibido (com acento). */
export const ARQUIVOS_WIKI: { arquivo: string; nome: string }[] = [
  {
    arquivo: "instrucoes-trello.pdf",
    nome: "Instruções TRELLO.pdf"
  },
  {
    arquivo: "instrucoes-resposta-email-analise-edital.pdf",
    nome: "Instruções de resposta de E-mail para Análise de Edital.pdf"
  },
  {
    arquivo: "modelo-pap.xlsx",
    nome: "Modelo-PaP.xlsx"
  },
  {
    arquivo: "resumo-cotacoes-servidores-hci.xlsx",
    nome: "Resumo de Cotações - Servidores-HCI.xlsx"
  },
  {
    arquivo: "template-systech-apresentacao-clientes.pptx",
    nome: "Template SYSTECH - Apresentação para Clientes.pptx"
  },
  {
    arquivo: "template-email.txt",
    nome: "Template de E-Mail.txt"
  },
  {
    arquivo: "template-sugestoes-corpo-email.xlsx",
    nome: "Template de Sugestões para o corpo do E-mail.xlsx"
  },
  {
    arquivo: "template-sugestoes.xlsx",
    nome: "Template de Sugestões.xlsx"
  }
];
const TAMANHO_LOCAL: Record<string, number> = {"instrucoes-trello.pdf": 640665, "instrucoes-resposta-email-analise-edital.pdf": 640759, "modelo-pap.xlsx": 119596, "resumo-cotacoes-servidores-hci.xlsx": 17126, "template-systech-apresentacao-clientes.pptx": 753923, "template-email.txt": 8448, "template-sugestoes-corpo-email.xlsx": 15087, "template-sugestoes.xlsx": 20521};
/** Arquivos que vêm junto com o portal (usados no piloto e enquanto a biblioteca não existir no SharePoint). */
export const ARQUIVOS_LOCAIS: ArquivoWiki[] = ARQUIVOS_WIKI.map(a => ({ nome: a.nome, arquivo: a.arquivo, descricao: DESCRICAO_ARQUIVO[a.nome], tamanho: TAMANHO_LOCAL[a.arquivo], local: true }));
export const urlLocal = (arquivo: string) => `wiki/arquivos/${encodeURIComponent(arquivo)}`;

/**
 * Corrige nomes de arquivo quebrados (acentos perdidos ao extrair um zip no Windows ou codificados como "#U00e7")
 * comparando com os nomes conhecidos sem os caracteres especiais. Nomes desconhecidos voltam como vieram.
 */
const esqueleto = (n: string) => n.replace(/#U[0-9a-fA-F]{4}/g, '').replace(/[^\x20-\x7E]|\?/g, '').toLowerCase();
export function nomeCorreto(nome: string): string {
  const decodificado = nome.replace(/#U([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  if (DESCRICAO_ARQUIVO[decodificado]) return decodificado;
  const porArquivo = ARQUIVOS_WIKI.find(a => a.arquivo === nome.toLowerCase());
  if (porArquivo) return porArquivo.nome;
  const k = esqueleto(nome);
  return ARQUIVOS_WIKI.find(a => esqueleto(a.nome) === k)?.nome || decodificado;
}
/** Tipo do arquivo pela extensão (ícone e rótulo). */
export function tipoArquivo(nome: string): { rotulo: string; cor: string } {
  const ext = (nome.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf') return { rotulo: 'PDF', cor: '#C0392B' };
  if (['xlsx', 'xls', 'csv'].includes(ext)) return { rotulo: 'XLS', cor: '#1D6F42' };
  if (['pptx', 'ppt'].includes(ext)) return { rotulo: 'PPT', cor: '#C4501E' };
  if (['docx', 'doc'].includes(ext)) return { rotulo: 'DOC', cor: '#2B579A' };
  return { rotulo: ext.toUpperCase().slice(0, 4) || 'ARQ', cor: '#5F6368' };
}

/* ---------------- edição dos documentos (lista "Portal Wiki" no SharePoint; navegador no piloto) ---------------- */

/** Documento salvo: substitui o padrão de mesmo id; "excluido" esconde um documento padrão. */
export interface ModeloSalvo extends Modelo { excluido?: boolean; atualizadoPor?: string; atualizado?: string }

/**
 * Texto editável do documento. Marcações (uma por linha):
 *   # Seção        • tópico        1. passo        ## subtítulo        Obs.: ...        NOTA: ...
 * Linhas sem marcação viram parágrafos; linhas em branco são ignoradas.
 */
export function docParaTexto(m: Modelo): string {
  return m.secoes.map(s => [`# ${s.titulo}`, ...s.itens].join('\n')).join('\n\n');
}
export function textoParaSecoes(texto: string): Modelo['secoes'] {
  const secoes: Modelo['secoes'] = [];
  for (const bruta of texto.replace(/\r/g, '').split('\n')) {
    const l = bruta.trimEnd();
    if (!l.trim()) continue;
    if (/^#\s+/.test(l) && !/^##\s/.test(l)) { secoes.push({ titulo: l.replace(/^#\s+/, '').trim(), itens: [] }); continue; }
    if (!secoes.length) secoes.push({ titulo: 'Geral', itens: [] });
    // aceita "- " e "* " como tópico também
    secoes[secoes.length - 1].itens.push(/^[-*]\s+/.test(l.trim()) ? `• ${l.trim().replace(/^[-*]\s+/, '')}` : l.trim());
  }
  return secoes;
}
/** Junta os documentos padrão com os salvos (os salvos ganham; os marcados como excluídos somem). */
export function juntarDocumentos(salvos: ModeloSalvo[] | null): ModeloSalvo[] {
  const porId = new Map((salvos || []).map(d => [d.id, d]));
  const base: ModeloSalvo[] = MODELOS.map(m => porId.get(m.id) || m);
  const extras = (salvos || []).filter(d => !MODELOS.some(m => m.id === d.id));
  return [...base, ...extras].filter(d => !d.excluido);
}
