🚀 Fullstack Lab

Um laboratório full-stack criado para estudar, construir e testar aplicações modernas reunindo backend, frontend, infraestrutura e automação. Este projeto serve como base sólida para desenvolver sistemas completos em ambiente local, Docker ou Kubernetes.

O objetivo é oferecer um ambiente prático e realista de aprendizado contínuo, explorando tecnologias atuais de desenvolvimento, DevOps, redes e deploy — tudo dentro de um único ecossistema evolutivo.

🧩 Stack Atual

Frontend: HTML, CSS, JavaScript (futuro suporte a Flutter ou Next.js)
Backend: Python + FastAPI (Node/Deno planejados para versões futuras)
Banco de Dados: PostgreSQL, Supabase ou SQLite
Infraestrutura: Docker, Docker Compose, K3s
Rede: Ingress NGINX + MetalLB
DevOps: GitHub, automações e futura integração com CI/CD

🏗 Arquitetura

A arquitetura segue a divisão clássica:

frontend → backend → database → infra/docker/k8s

Toda a documentação organizada, incluindo diagramas e anotações, está na pasta /docs.

🛠 Funcionalidades em Desenvolvimento

⚙️ Estrutura inicial de frontend e backend

🐳 Ambiente Docker para desenvolvimento local

☸️ Deploy em cluster usando K3s

📜 Scripts de automação e setup rápido

🔌 Modelos de API e rotas base

❤️‍🩹 Página de testes e health checks

▶️ Como Executar
💻 Modo Local
cd infra
docker-compose up --build

☸️ Modo Cluster (K3s)
kubectl apply -f infra/k8s/

📚 Documentação

A pasta /docs contém:

🧱 Arquitetura

🗺️ Roadmap

📝 Notas de estudo

🖼️ Prints do laboratório

🧭 Diagramas técnicos

🛣️ Roadmap

🖥️ Criar interface web básica

🔧 Criar API funcional

🗄️ Configurar banco e migrations

🔐 Adicionar autenticação

🤖 Criar automações

☸️ Deploy no cluster K3s

🔁 Pipeline CI/CD

🌐 Criar versão demo online

👤 Autor

Desenvolvido por Adelmo Godoy, entusiasta de infraestrutura, aplicações e automação — sempre criando ambientes experimentais que evoluem para projetos reais.
