# 🚀 Fullstack Lab

![Arquitetura do Projeto](docs/img/architecture.png)  

Um laboratório full-stack criado para estudar, construir e testar aplicações modernas reunindo backend, frontend, infraestrutura e automação. O projeto serve como base sólida para desenvolvimento local (Docker) ou distribuído (K3s + Kubernetes).

---

## 🏷️ Badges

![Status](https://img.shields.io/badge/status-em_desenvolvimento-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)
![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/kubernetes-K3s-326CE5?logo=kubernetes&logoColor=white)
![GitHub](https://img.shields.io/badge/made_by-Adelmo_Godoy-black)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20Docker%20%7C%20K3s-lightgrey)

---

## 📑 Tabela de Conteúdos

- [Stack Atual](#-stack-atual)  
- [Arquitetura](#-arquitetura)  
- [Demonstração](#-demonstração)  
- [Funcionalidades](#-funcionalidades)  
- [Como Executar](#-como-executar)  
- [Documentação](#-documentação)  
- [Tecnologias Usadas](#-tecnologias-usadas)  
- [Roadmap](#-roadmap)  
- [Contribuindo](#-contribuindo)  
- [Licença](#-licença)  
- [Autor](#-autor)

---

## 🧩 Stack Atual

**Frontend:** HTML, CSS, JavaScript (futuro: Flutter ou Next.js)  
**Backend:** FastAPI (futuro: Node/Deno)  
**Banco de Dados:** PostgreSQL, Supabase ou SQLite  
**Infraestrutura:** Docker, Docker Compose, K3s  
**Rede:** Ingress NGINX + MetalLB  
**DevOps:** GitHub, automações e CI/CD (futuro)  

---

## 🏗 Arquitetura

A estrutura do projeto segue o fluxo:

```text
frontend → backend → database → infra (docker/k8s)

