# 🚀 Guia de Deploy: Geração de APK e Deploy na VPS Oracle Cloud

Este guia fornece o passo a passo completo para:
1. **Gerar o arquivo APK do aplicativo Android** para instalar diretamente nos celulares dos testadores.
2. **Subir a infraestrutura Docker (API + PostgreSQL + Redis)** na sua VPS Oracle Cloud (OCI Always Free).

---

## 📱 ETAPA 1: Gerar o Arquivo APK para Android

Para gerar um arquivo `.apk` independente (sem precisar do Expo Go ou do computador ligado):

### 1.1. Instalar o EAS CLI (Expo Application Services)
No terminal do seu computador, execute:
```bash
npm install -g eas-cli
```

### 1.2. Fazer Login na sua conta Expo
```bash
eas login
```
*(Caso não tenha uma conta, crie gratuitamente no site [expo.dev](https://expo.dev)).*

### 1.3. Executar o Build do APK (Perfil Preview)
Execute o comando de compilação do APK:
```bash
eas build -p android --profile preview
```

### 1.4. Instalação no Celular
- O Expo compilará o app nos servidores na nuvem (leva cerca de 5 a 10 minutos).
- Ao final, o terminal exibirá um **QR Code** e um **Link direto para baixar o arquivo `.apk`**.
- Abra o link no celular Android e instale o `.apk` diretamente!

---

## ☁️ ETAPA 2: Subir a Infraestrutura Docker na VPS Oracle Cloud

### 2.1. Conectar na sua VPS via SSH
No seu terminal:
```bash
ssh ubuntu@<IP_DA_SUA_VPS_ORACLE>
```

### 2.2. Instalar Docker & Docker Compose na VPS Oracle
Execute os comandos abaixo na VPS:
```bash
# Atualizar pacotes
sudo apt update && sudo apt upgrade -y

# Instalar Docker
sudo apt install docker.io docker-compose-v2 -y

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### 2.3. Liberar as Portas no Firewall da VPS (Oracle OCI & iptables)
No painel da Oracle Cloud (Security Lists da VCN), adicione uma Ingress Rule permitindo a porta `4000` (TCP).

No terminal da VPS, libere a porta no firewall interno:
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 4000 -j ACCEPT
sudo netfilter-persistent save
```

### 2.4. Enviar o Projeto para a VPS e Subir os Containers
Na VPS, clone o repositório ou copie a pasta do projeto:
```bash
git clone <URL_DO_SEU_REPOSITORIO> liferoutine
cd liferoutine

# Subir os containers em segundo plano
docker compose up -d
```

### 2.5. Testar a API na VPS Oracle
Execute no terminal da VPS ou no seu navegador:
```bash
curl http://localhost:4000/health
```
**Resposta esperada:**
```json
{"status":"ok","service":"LifeRoutine API","database":"connected","timestamp":"..."}
```

---

## 🔗 ETAPA 3: Conectar o APK com o Servidor na VPS Oracle

No arquivo [.env](file:///c:/projetosmobile/LifeRoutine/.env.example) do seu projeto no computador, defina o IP público da sua VPS Oracle:

```env
EXPO_PUBLIC_BACKEND_API_URL=http://<IP_DA_SUA_VPS_ORACLE>:4000
```

Em seguida, gere o APK final com o comando:
```bash
eas build -p android --profile preview
```
Pronto! Seu aplicativo em formato `.apk` estará 100% conectado com o banco de dados PostgreSQL rodando na sua VPS Oracle Cloud!
