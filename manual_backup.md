# Manual de Backup Completo - Supabase

## 📋 Índice
1. [O que é incluído no backup](#o-que-é-incluído-no-backup)
2. [Pré-requisitos](#pré-requisitos)
3. [Backup Manual (Windows)](#backup-manual-windows)
4. [Backup Manual (Linux/VPS)](#backup-manual-linuxvps)
5. [Backup Automático (Node-RED)](#backup-automático-node-red)
6. [Comandos Úteis](#comandos-úteis)
7. [Restauração](#restauração)
8. [Troubleshooting](#troubleshooting)

---

## 📦 O que é incluído no backup

| Componente | Comando | Incluído? |
|------------|---------|-----------|
| **Roles** (usuários/permissões PostgreSQL) | `db dump --role-only` | ✅ Sim |
| **Schema** (tabelas, views, functions, triggers, RLS) | `db dump` | ✅ Sim |
| **Data** (dados das tabelas) | `db dump --data-only` | ✅ Sim |
| **Auth Users** (tabela auth.users) | `db dump --data-only` | ✅ Sim |
| **Storage** (arquivos: fotos, PDFs) | `storage cp` | ✅ Sim |
| Edge Functions | - | ❌ Manter no Git |
| API Keys | - | ❌ Documentar manualmente |
| Secrets/Env Vars | - | ❌ Documentar em .env.example |
| Dashboard Config | - | ❌ Screenshot/Documentar |

---

## 🔧 Pré-requisitos

### Windows
```powershell
# Instalar Supabase CLI via Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Fazer login
supabase login

# Linkar projeto
supabase link --project-ref SEU_PROJECT_REF
```

### Linux/VPS
```bash
# Baixar e instalar Supabase CLI
curl -L https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz -o supabase.tar.gz
tar -xzf supabase.tar.gz
sudo mv supabase /usr/local/bin/
rm supabase.tar.gz

# Verificar instalação
supabase --version

# Instalar Docker (necessário para db dump --linked)
curl -fsSL https://get.docker.com | sh
systemctl start docker
systemctl enable docker

# Verificar Docker
docker --version

# Fazer login no Supabase
supabase login

# Linkar projeto
supabase link --project-ref SEU_PROJECT_REF
```

---

## 💻 Backup Manual (Windows)

### Backup Completo
```powershell
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "./backup_$timestamp"

# Criar pasta
New-Item -ItemType Directory -Path $backupDir

# 1. Roles
supabase db dump --linked -f "$backupDir/roles_$timestamp.sql" --role-only

# 2. Schema
supabase db dump --linked -f "$backupDir/schema_$timestamp.sql"

# 3. Data
supabase db dump --linked -f "$backupDir/data_$timestamp.sql" --data-only --use-copy

# 4. Storage
supabase storage cp -r ss:/// "$backupDir/storage" --experimental

# 5. Comprimir
Compress-Archive -Path $backupDir -DestinationPath "./backup_completo_$timestamp.zip"

# 6. Limpar pasta temp
Remove-Item -Recurse -Force $backupDir

Write-Host "✅ Backup criado: backup_completo_$timestamp.zip"
```

---

## 🐧 Backup Manual (Linux/VPS)

### Backup Completo
```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups/temp_$TIMESTAMP"
FINAL_FILE="/root/backups/backup_completo_$TIMESTAMP.tar.gz"

# Criar pasta
mkdir -p $BACKUP_DIR

# 1. Roles (permissões PostgreSQL)
supabase db dump --linked -f $BACKUP_DIR/roles_$TIMESTAMP.sql --role-only

# 2. Schema (estrutura do banco)
supabase db dump --linked -f $BACKUP_DIR/schema_$TIMESTAMP.sql

# 3. Data (dados das tabelas)
supabase db dump --linked -f $BACKUP_DIR/data_$TIMESTAMP.sql --data-only --use-copy

# 4. Storage (arquivos)
supabase storage cp -r ss:/// $BACKUP_DIR/storage --experimental

# 5. Comprimir tudo
tar -czf $FINAL_FILE -C $BACKUP_DIR .

# 6. Limpar pasta temp
rm -rf $BACKUP_DIR

# 7. Remover backups > 7 dias
find /root/backups -name 'backup_completo_*.tar.gz' -mtime +7 -delete

echo "✅ Backup criado: $FINAL_FILE"
```

---

## 🤖 Backup Automático (Node-RED)

O fluxo Node-RED está configurado para fazer **backup completo**:

### O que faz:
| Etapa | Descrição | Timeout |
|-------|-----------|---------|
| 1️⃣ | Exporta **Roles** (permissões PostgreSQL) | 2 min |
| 2️⃣ | Exporta **Schema** (estrutura do banco) | 5 min |
| 3️⃣ | Exporta **Data** (dados das tabelas) | 10 min |
| 4️⃣ | Baixa **Storage** (todos os arquivos) | 15 min |
| 📦 | Comprime tudo em `.tar.gz` | 10 min |
| 🗑️ | Remove pasta temporária | - |
| 🧹 | Remove backups > 7 dias | - |

### Agendamento:
- ⏰ **Diariamente às 03:00** (horário do servidor)
- 🔘 Botão para execução manual disponível

### Arquivo gerado:
```
/root/backups/backup_completo_YYYYMMDD_HHMMSS.tar.gz
```

### Conteúdo do arquivo:
```
backup_completo_20260102_030000.tar.gz
├── roles_20260102_030000.sql      # Usuários e permissões PostgreSQL
├── schema_20260102_030000.sql     # Estrutura: tabelas, views, functions, RLS
├── data_20260102_030000.sql       # Dados de todas as tabelas
└── storage/                        # Arquivos do Storage
    ├── documentos/
    │   └── notas-fiscais/
    ├── documentos-privados/
    ├── fotos-obra/
    ├── fotos-temp/
    │   ├── email/
    │   └── ocr/
    ├── notas-compras/
    │   ├── email/
    │   └── ocr/
    └── recibos/
        └── comprovantes/
```

### Como importar o fluxo:
1. Acesse http://191.252.214.134:1880
2. Menu (☰) → Import
3. Selecione o arquivo `node-red.json`
4. Clique em **Import**
5. Clique em **Deploy** (canto superior direito)

---

## 🛠️ Comandos Úteis

### Listar buckets do Storage
```bash
supabase storage ls --experimental
```

### Verificar tamanho dos backups
```bash
du -sh /root/backups/
ls -lh /root/backups/
```

### Ver conteúdo de um backup
```bash
tar -tzvf /root/backups/backup_completo_XXXXXX.tar.gz
```

### Baixar backup da VPS para PC local
```powershell
scp root@191.252.214.134:/root/backups/backup_completo_XXXXXX.tar.gz C:\Users\felip\Downloads\
```

### Verificar se está logado
```bash
supabase projects list
```

### Ver status do Docker
```bash
docker ps
systemctl status docker
```

---

## 🔄 Restauração

### 1. Extrair o backup
```bash
mkdir /tmp/restore
tar -xzf backup_completo_XXXXXX.tar.gz -C /tmp/restore
```

### 2. Restaurar Roles (se necessário)
```bash
# Cuidado: pode conflitar com roles existentes
psql "CONNECTION_STRING" -f /tmp/restore/roles_XXXXXX.sql
```

### 3. Restaurar Schema
```bash
psql "CONNECTION_STRING" -f /tmp/restore/schema_XXXXXX.sql
```

### 4. Restaurar Data
```bash
psql "CONNECTION_STRING" -f /tmp/restore/data_XXXXXX.sql
```

### 5. Restaurar Storage
```bash
# Upload de volta para o Supabase Storage
supabase storage cp -r /tmp/restore/storage ss:/// --experimental
```

---

## 🔍 Troubleshooting

### Erro: "Docker not found"
```bash
# Verificar se Docker está instalado
docker --version

# Se não estiver, instalar
curl -fsSL https://get.docker.com | sh
systemctl start docker
systemctl enable docker
```

### Erro: "Project not linked"
```bash
supabase link --project-ref hugcvafgqcptxkhtueyv
```

### Erro: "Not logged in"
```bash
supabase login
```

### Verificar token salvo
```bash
cat ~/.supabase/access-token
```

### Ver tokens ativos
https://supabase.com/dashboard/account/tokens

### Erro de timeout no backup
Aumentar o timeout no Node-RED ou executar manualmente com mais tempo:
```bash
# Executar cada comando individualmente para identificar qual demora
time supabase db dump --linked -f /tmp/test_schema.sql
time supabase storage cp -r ss:/// /tmp/test_storage --experimental
```

---

## 📁 Estrutura de Backups na VPS

```
/root/backups/
├── backup_completo_20260101_030000.tar.gz
├── backup_completo_20260102_030000.tar.gz
├── backup_completo_20260103_030000.tar.gz
└── ... (últimos 7 dias)
```

---

## 🔗 Links Úteis

- [Documentação Supabase Backups](https://supabase.com/docs/guides/platform/backups)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/supabase-db-dump)
- [Backup e Restore via CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)

---

**Projeto:** Toniezzer  
**Project Ref:** `hugcvafgqcptxkhtueyv`  
**VPS:** `191.252.214.134`  
**Node-RED:** http://191.252.214.134:1880
