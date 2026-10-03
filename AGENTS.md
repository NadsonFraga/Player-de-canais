# Regras do Agente — Tvzinha Online (Player-de-canais)

Este documento define as diretrizes operacionais mandatórias para qualquer agente de IA trabalhando neste repositório, em qualquer ambiente (Casa, Trabalho ou CI).

---

## 1. Padrão Arquitetural: Submódulo Privado `.archives/`

1. **Separação de Privacidade:**
   - O repositório principal (`Player-de-canais`) é de código público.
   - A pasta `.archives/` é um **Git Submodule** apontando para o repositório privado `NadsonFraga/Player-de-canais-archives`.
   - NUNCA armazene relatórios internos, memórias de agente, blueprints confidenciais ou anotações proprietárias fora de `.archives/`.

2. **Destino dos Artefatos do Agente:**
   - Todos os relatórios gerados, planos detalhados, logs de decisão arquitetural e memórias de tarefas devem ser gravados dentro de `.archives/`.

---

## 2. Protocolo Mandatório de Sincronização (Pull & Push)

### A. Ao Iniciar uma Tarefa ou Puxar Alterações (`Pull`)
Sempre que o agente iniciar um turno de trabalho, analisar o projeto ou realizar `git pull` para atualizar o código principal, ele **DEVE OBRIGATORIAMENTE** sincronizar o submódulo para trazer as últimas notas criadas em outros computadores (ex: PC do trabalho):

```powershell
# Garantir inicialização e sincronizar com o commit mais recente do repo privado
git submodule update --init --recursive
git submodule update --remote --merge
```

### B. Ao Criar ou Editar Arquivos em `.archives/` (`Push`)
Sempre que novos relatórios, documentos ou memórias forem gerados ou modificados dentro de `.archives/`:

1. **Commit e Push no repositório privado do submódulo:**
   ```powershell
   cd .archives
   git add .
   git commit -m "docs(archives): <descrição concisa das notas/relatórios gerados>"
   git push origin main
   cd ..
   ```

2. **Atualização do ponteiro no projeto principal:**
   ```powershell
   git add .archives
   git commit -m "chore: sync .archives submodule pointer"
   git push origin master
   ```

---

## 3. Segurança e Prevenção de Vazamento
- **Jamais** versione tokens, segredos, credenciais ou dados privados no repositório principal.
- Verifique sempre o `git status` antes de comitar no projeto principal para garantir que arquivos de rascunho privados não foram adicionados acidentalmente fora de `.archives/`.