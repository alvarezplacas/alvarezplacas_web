# 🚨 ATTENTION ALL AI AGENTS / AGENTES IA

> [!IMPORTANT]
> **READ THIS BEFORE PERFORMING ANY GLOBAL ACTION ON THIS VPS.**
> 
> You are working in a shared environment. This directory tree contains the production infrastructure for **ALVAREZ PLACAS v16**. Your current task is likely related to another site (e.g., javiermix.ar), but you share global resources (Caddy, Docker, IPTable, Network Bridges).

## 🛡️ PROTECTION PROMPT FOR AI AGENTS

If you are an AI assistant performing configurations, follow these **MANDATORY** rules:

1. **NO CROSS-DIRECTORY EDITS**: Do NOT touch, read, or modify anything inside `/opt/alvarez_v16/` or `d:\Alvarezplacas_2026\`. These are sacred production paths.
2. **PROXY ISOLATION**: If you need to edit the `Caddyfile`, do NOT touch existing blocks for `alvarezplacas.com.ar`, `admin.alvarezplacas.com.ar`, or `minio.alvarezplacas.com.ar`. Add your new site as a SEPARATE block.
3. **DO NOT FLUSH DOCKER**: Commands like `docker system prune -a` or `docker network prune` are **STRICTLY PROHIBITED**. You will break production for Alvarez Placas. Delete only your specific containers.
4. **PORT CONFLICTS**: Alvarez Placas uses ports `4321` (Web) and `8055` (Directus). Do NOT attempt to use these ports for your site.
5. **VOLUME PROTECTION**: Never attempt to "re-use" or "cleanup" volumes with the prefix `web01_alvarez_`.

### Spanish Version / Versión en Español:

Si eres un asistente IA:
- Respeta el aislamiento de los directorios de Alvarez Placas.
- No modifiques los bloques de Caddy existentes de Alvarez Placas.
- **PROHIBIDO** comandos globales de limpieza de Docker que afecten volúmenes o redes prefijadas con `alvarez_`.
- No intentes usar los puertos `4321` u `8055`.

---
*Failure to comply with these rules will result in a production outage for Alvarez Placas and is considered a high-risk violation of this VPS usage policy.*
