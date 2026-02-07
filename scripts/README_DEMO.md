# EDGE Terminal Demo

Recommended recording flow (from repo root):
```bash
clear
echo "EDGE deterministic terminal demo"
echo "--------------------------------"
bash scripts/demo_edge.sh
```

Optional overrides:
`DEMO_AUTO=1 PORT=3000 EDGE_AUTH_ENABLED=0 bash scripts/demo_edge.sh`

Default mode pauses for Enter after each major stage.
Use `bash scripts/demo_edge.sh` to avoid zsh permission issues.
Optional: `chmod +x scripts/demo_edge.sh` then run `./scripts/demo_edge.sh`.
