/**
 * TVZINHA ONLINE - Static Fallback Channels Catalog
 * Auto-synchronized dataset for offline resilience.
 */

export const FALLBACK_CHANNELS = {
  "TV Aberta": {
    "Globo": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://tufazeseli.bombrilhoso.lat/docs/pinhal15/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InBpbmhhbDE1IiwicCI6InBlbnRlcm9zYS5sYXQiLCJwYXRoIjoiL3BpbmhhbDE1L2luZGV4LnR4dCIsImUiOjE3OTU1NDExNjMsImoiOiJhYTA3OGU2Ni0yNTc4LTRmYjctOTBlMC01YzNkMzM4YmRjYmEiLCJpYXQiOjE3OTU1NDA4NjMsInJzIjoiZ2xvYm9zcCIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.a7a73966094eee8eeb3e77775b09e24b5b26b96d41fa9d796d3d327b79492984",
          "slug": "globosp",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://tufazeseli.bombrilhoso.lat/docs/pinhal15/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InBpbmhhbDE1IiwicCI6InBlbnRlcm9zYS5sYXQiLCJwYXRoIjoiL3BpbmhhbDE1L2luZGV4LnR4dCIsImUiOjE3OTU1NDExNjMsImoiOiJhYTA3OGU2Ni0yNTc4LTRmYjctOTBlMC01YzNkMzM4YmRjYmEiLCJpYXQiOjE3OTU1NDA4NjMsInJzIjoiZ2xvYm9zcCIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.a7a73966094eee8eeb3e77775b09e24b5b26b96d41fa9d796d3d327b79492984",
          "slug": "globosp",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "SP - Backup": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=globosp",
        "RJ - Backup": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=globorj",
        "BA - Backup": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=globoba",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/globosp",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/globosp"
      }
    },
    "Band": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://bedunupori.bombrilhoso.lat/docs/guarita33/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6Imd1YXJpdGEzMyIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9ndWFyaXRhMzMvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTE2NiwiaiI6ImMzZDg2MTYwLWY2OGItNDEwNi1iOWZkLWYxZjIwZDc4NDk2NSIsImlhdCI6MTc5NTU0MDg2NiwicnMiOiJiYW5kc3AiLCJuYiI6IjJmZTA2MmY5MTYwZTZkNzUxMDBmZWNiMzIxMGUwODE5ZTJkY2ZmMTc1YmVmZjE1ZGI3YTAwZjM1M2M2NWU3ZjciLCJuZiI6Nn0.0470bce2cb953ed9b2da41a64b8d8b01d5cac832f47d9f5927f048c75ae1003b",
          "slug": "bandsp",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://bedunupori.bombrilhoso.lat/docs/guarita33/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6Imd1YXJpdGEzMyIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9ndWFyaXRhMzMvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTE2NiwiaiI6ImMzZDg2MTYwLWY2OGItNDEwNi1iOWZkLWYxZjIwZDc4NDk2NSIsImlhdCI6MTc5NTU0MDg2NiwicnMiOiJiYW5kc3AiLCJuYiI6IjJmZTA2MmY5MTYwZTZkNzUxMDBmZWNiMzIxMGUwODE5ZTJkY2ZmMTc1YmVmZjE1ZGI3YTAwZjM1M2M2NWU3ZjciLCJuZiI6Nn0.0470bce2cb953ed9b2da41a64b8d8b01d5cac832f47d9f5927f048c75ae1003b",
          "slug": "bandsp",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/eventos/band.html?id=019a797e-eeb8-7eda-9518-132403ccb160",
        "Servidor 2": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/eventos/band.html?id=019cc41a-ccc4-75e0-a31f-9bf47fad8d8b",
        "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/bandsp",
        "Servidor 4 (EmbedTV)": "https://w7.embedtv.lat/bandrj",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/bandsp",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/bandsp"
      }
    },
    "SBT": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://zosogote.bombrilhoso.lat/docs/turquesa67/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InR1cnF1ZXNhNjciLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvdHVycXVlc2E2Ny9pbmRleC50eHQiLCJlIjoxNzk1NTQxMTY4LCJqIjoiM2EwN2E3ZDMtZmUxMi00MTI2LTlhMTctODBmODNhOWNhNDQxIiwiaWF0IjoxNzk1NTQwODY4LCJycyI6InNidCIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.1a63385283be99c7ff401213703434928ba19b74e9939a6faf0879f66a76a415",
          "slug": "sbt",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://zosogote.bombrilhoso.lat/docs/turquesa67/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InR1cnF1ZXNhNjciLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvdHVycXVlc2E2Ny9pbmRleC50eHQiLCJlIjoxNzk1NTQxMTY4LCJqIjoiM2EwN2E3ZDMtZmUxMi00MTI2LTlhMTctODBmODNhOWNhNDQxIiwiaWF0IjoxNzk1NTQwODY4LCJycyI6InNidCIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.1a63385283be99c7ff401213703434928ba19b74e9939a6faf0879f66a76a415",
          "slug": "sbt",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "SP - Principal": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=sbtsp",
        "RJ - Principal": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=sbtrj",
        "Alternativo": "https://youtube-player.sbt.com.br/?videoID=ABVQXgr2LW4&t=0&adunit=/1011235/SBT_Videos/Especiais/SBT_Live/video",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/sbt",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/sbt"
      }
    },
    "Record": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://bumubevumo.bombrilhoso.lat/docs/incenso45/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImluY2Vuc280NSIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9pbmNlbnNvNDUvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTE3MCwiaiI6IjI3M2YyMmYxLTdlNTctNDUxMS1hZmI5LWJiMWU5YWZlZDI4NyIsImlhdCI6MTc5NTU0MDg3MCwicnMiOiJyZWNvcmRzcCIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.fa6e925e1e70059c5a2c6cc3bfcaab36b107fdb470cce3940465edae29b6ea45",
          "slug": "recordsp",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://bumubevumo.bombrilhoso.lat/docs/incenso45/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImluY2Vuc280NSIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9pbmNlbnNvNDUvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTE3MCwiaiI6IjI3M2YyMmYxLTdlNTctNDUxMS1hZmI5LWJiMWU5YWZlZDI4NyIsImlhdCI6MTc5NTU0MDg3MCwicnMiOiJyZWNvcmRzcCIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.fa6e925e1e70059c5a2c6cc3bfcaab36b107fdb470cce3940465edae29b6ea45",
          "slug": "recordsp",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "SP - EmbedTV": "https://w7.embedtv.lat/recordsp",
        "RJ - EmbedTV": "https://w7.embedtv.lat/recordrj",
        "MG - EmbedTV": "https://w7.embedtv.lat/recordmg",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/recordsp",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/recordsp"
      }
    }
  },
  "Esportes": {
    "SporTV": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://muputabo.bombrilhoso.lat/docs/palermo32/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InBhbGVybW8zMiIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9wYWxlcm1vMzIvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTE3MiwiaiI6IjhlYmY0YWFjLWQ4MGEtNDQwMy1hZjJjLTVkZDcxN2UwMDNlYiIsImlhdCI6MTc5NTU0MDg3MiwicnMiOiJzcG9ydHYiLCJuYiI6IjJmZTA2MmY5MTYwZTZkNzUxMDBmZWNiMzIxMGUwODE5ZTJkY2ZmMTc1YmVmZjE1ZGI3YTAwZjM1M2M2NWU3ZjciLCJuZiI6Nn0.16af05f6a1886e9945922c39b2d7bec0af4c3b3cc25920ccfb2d314c1959004c",
          "slug": "sportv",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://muputabo.bombrilhoso.lat/docs/palermo32/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InBhbGVybW8zMiIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9wYWxlcm1vMzIvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTE3MiwiaiI6IjhlYmY0YWFjLWQ4MGEtNDQwMy1hZjJjLTVkZDcxN2UwMDNlYiIsImlhdCI6MTc5NTU0MDg3MiwicnMiOiJzcG9ydHYiLCJuYiI6IjJmZTA2MmY5MTYwZTZkNzUxMDBmZWNiMzIxMGUwODE5ZTJkY2ZmMTc1YmVmZjE1ZGI3YTAwZjM1M2M2NWU3ZjciLCJuZiI6Nn0.16af05f6a1886e9945922c39b2d7bec0af4c3b3cc25920ccfb2d314c1959004c",
          "slug": "sportv",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Alternativo": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=sportv",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/sportv",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/sportv"
      }
    },
    "SporTV 2": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://gapibafu.bombrilhoso.lat/docs/valente39/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InZhbGVudGUzOSIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii92YWxlbnRlMzkvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTE3NCwiaiI6IjExODNhMmNmLWRlNTAtNDMwNS05MzczLWE1NmU3YzBjZjg5YyIsImlhdCI6MTc5NTU0MDg3NCwicnMiOiJzcG9ydHYyIiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.2815961fb49c58788c35b5d32300efad942ba3b49a2c0634239113132d24f6f9",
          "slug": "sportv2",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://gapibafu.bombrilhoso.lat/docs/valente39/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InZhbGVudGUzOSIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii92YWxlbnRlMzkvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTE3NCwiaiI6IjExODNhMmNmLWRlNTAtNDMwNS05MzczLWE1NmU3YzBjZjg5YyIsImlhdCI6MTc5NTU0MDg3NCwicnMiOiJzcG9ydHYyIiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.2815961fb49c58788c35b5d32300efad942ba3b49a2c0634239113132d24f6f9",
          "slug": "sportv2",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/sportv2",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/sportv2"
      }
    },
    "SporTV 3": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://malibace.bombrilhoso.lat/docs/granito55/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImdyYW5pdG81NSIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9ncmFuaXRvNTUvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTE3NiwiaiI6IjJhMzgxMGQ2LTAzNjItNDJkYS1hNGZiLTU3MzI0OGYxYmE1NyIsImlhdCI6MTc5NTU0MDg3NiwicnMiOiJzcG9ydHYzIiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.46c4e7eea69adbd7b86cbbc508a210cdf0fa1e680d774968311fa2fb09c7a21d",
          "slug": "sportv3",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://malibace.bombrilhoso.lat/docs/granito55/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImdyYW5pdG81NSIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9ncmFuaXRvNTUvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTE3NiwiaiI6IjJhMzgxMGQ2LTAzNjItNDJkYS1hNGZiLTU3MzI0OGYxYmE1NyIsImlhdCI6MTc5NTU0MDg3NiwicnMiOiJzcG9ydHYzIiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.46c4e7eea69adbd7b86cbbc508a210cdf0fa1e680d774968311fa2fb09c7a21d",
          "slug": "sportv3",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1 (MeuPlayer)": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/primebr.html?id=sportv3",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/sportv3",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/sportv3"
      }
    },
    "Premiere": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://rosebonu.bombrilhoso.lat/docs/sincero92/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InNpbmNlcm85MiIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9zaW5jZXJvOTIvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTE3OCwiaiI6ImE5MThiZWYxLWMwYjgtNDBjMi1hZWRhLTc3NDVmNGMyZjE4OCIsImlhdCI6MTc5NTU0MDg3OCwicnMiOiJwcmVtaWVyZSIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.e1929d5e1ba5d9dd7d258454779f7d3b55cba8696bce103d4f599311d7a4cdc8",
          "slug": "premiere",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://rosebonu.bombrilhoso.lat/docs/sincero92/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InNpbmNlcm85MiIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9zaW5jZXJvOTIvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTE3OCwiaiI6ImE5MThiZWYxLWMwYjgtNDBjMi1hZWRhLTc3NDVmNGMyZjE4OCIsImlhdCI6MTc5NTU0MDg3OCwicnMiOiJwcmVtaWVyZSIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.e1929d5e1ba5d9dd7d258454779f7d3b55cba8696bce103d4f599311d7a4cdc8",
          "slug": "premiere",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1 (MeuPlayer)": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=premiere",
        "Servidor 4 (EmbedTV)": "https://w7.embedtv.lat/premiere",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/premiere",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/premiere"
      }
    },
    "Premiere 2": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/32d0f232cb414dced4a9f7cfb560e38f/error.txt",
          "slug": "premiere2",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/32d0f232cb414dced4a9f7cfb560e38f/error.txt",
          "slug": "premiere2",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/premiere2",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/premiere2"
      }
    },
    "Premiere 3": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/93e2f362ec6ebc6ecbb5b924b5f7bc2f/error.txt",
          "slug": "premiere3",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/93e2f362ec6ebc6ecbb5b924b5f7bc2f/error.txt",
          "slug": "premiere3",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/premiere3",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/premiere3"
      }
    },
    "Premiere 4": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/fc9ce7a7afcbf1cb58f6e3750cf97798/error.txt",
          "slug": "premiere4",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/fc9ce7a7afcbf1cb58f6e3750cf97798/error.txt",
          "slug": "premiere4",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/premiere4",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/premiere4"
      }
    },
    "Premiere 5": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/26551dc5e0598c06dc4a1ac25734ddd2/error.txt",
          "slug": "premiere5",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/26551dc5e0598c06dc4a1ac25734ddd2/error.txt",
          "slug": "premiere5",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/premiere5",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/premiere5"
      }
    },
    "Premiere 6": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/16e9fbba7964cc15a0160c897ed9e419/error.txt",
          "slug": "premiere6",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/16e9fbba7964cc15a0160c897ed9e419/error.txt",
          "slug": "premiere6",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/premiere6",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/premiere6"
      }
    },
    "Premiere 7": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/594168f82024592636dc9354eaf706cc/error.txt",
          "slug": "premiere7",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/594168f82024592636dc9354eaf706cc/error.txt",
          "slug": "premiere7",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/premiere7",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/premiere7"
      }
    },
    "Premiere Clubes": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://73a017eaa1bb2a452b5bcc92acd54acb.s23-cloudfront-net.lat/8e8e8b142192ea65/premiere.txt",
          "slug": "premiere",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s23-cloudfront-net.lat/8e8e8b142192ea65/premiere.txt",
          "slug": "premiere",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/premiere-clubes",
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/premiereclubes"
      }
    },
    "ESPN": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://cubapipena.bombrilhoso.lat/docs/tridente49/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InRyaWRlbnRlNDkiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvdHJpZGVudGU0OS9pbmRleC50eHQiLCJlIjoxNzk1NTQxMjkzLCJqIjoiNTFjNjliZWUtODZkOC00OTFkLTkyNjUtYmUwMzA1OTJlNmViIiwiaWF0IjoxNzk1NTQwOTkzLCJycyI6ImVzcG4iLCJuYiI6IjJmZTA2MmY5MTYwZTZkNzUxMDBmZWNiMzIxMGUwODE5ZTJkY2ZmMTc1YmVmZjE1ZGI3YTAwZjM1M2M2NWU3ZjciLCJuZiI6Nn0.8229da91a3ae2ab6a723829875014f62149bd354dae786181af904e346a94ee1",
          "slug": "espn",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://cubapipena.bombrilhoso.lat/docs/tridente49/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InRyaWRlbnRlNDkiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvdHJpZGVudGU0OS9pbmRleC50eHQiLCJlIjoxNzk1NTQxMjkzLCJqIjoiNTFjNjliZWUtODZkOC00OTFkLTkyNjUtYmUwMzA1OTJlNmViIiwiaWF0IjoxNzk1NTQwOTkzLCJycyI6ImVzcG4iLCJuYiI6IjJmZTA2MmY5MTYwZTZkNzUxMDBmZWNiMzIxMGUwODE5ZTJkY2ZmMTc1YmVmZjE1ZGI3YTAwZjM1M2M2NWU3ZjciLCJuZiI6Nn0.8229da91a3ae2ab6a723829875014f62149bd354dae786181af904e346a94ee1",
          "slug": "espn",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/espn",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/espn",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/espn"
      }
    },
    "ESPN 2": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://caguvabopu.bombrilhoso.lat/docs/nobreza80/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6Im5vYnJlemE4MCIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9ub2JyZXphODAvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTI5NSwiaiI6IjEzYzI0NzZlLTliZWEtNGMxNS1iNWE4LTI1YWFjOWM3Yzk1ZCIsImlhdCI6MTc5NTU0MDk5NSwicnMiOiJlc3BuMiIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.6de9386aabfc097ee0ae1c566b7223cec5bffcdaf608b8be0e065a9e0bf35af4",
          "slug": "espn2",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://caguvabopu.bombrilhoso.lat/docs/nobreza80/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6Im5vYnJlemE4MCIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9ub2JyZXphODAvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTI5NSwiaiI6IjEzYzI0NzZlLTliZWEtNGMxNS1iNWE4LTI1YWFjOWM3Yzk1ZCIsImlhdCI6MTc5NTU0MDk5NSwicnMiOiJlc3BuMiIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.6de9386aabfc097ee0ae1c566b7223cec5bffcdaf608b8be0e065a9e0bf35af4",
          "slug": "espn2",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/espn2",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/espn2",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/espn2"
      }
    },
    "ESPN 3": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://badifuta.bombrilhoso.lat/docs/cacto96/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImNhY3RvOTYiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvY2FjdG85Ni9pbmRleC50eHQiLCJlIjoxNzk1NTQxMjk4LCJqIjoiMGYyOWEwNjQtZmZmOS00NjQzLWExYjgtNWNjN2MxMzRmMzE3IiwiaWF0IjoxNzk1NTQwOTk4LCJycyI6ImVzcG4zIiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.29647cef4bc54aa67d89b239c48782807cfa24f81a6e9a7579bd42d977707415",
          "slug": "espn3",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://badifuta.bombrilhoso.lat/docs/cacto96/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImNhY3RvOTYiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvY2FjdG85Ni9pbmRleC50eHQiLCJlIjoxNzk1NTQxMjk4LCJqIjoiMGYyOWEwNjQtZmZmOS00NjQzLWExYjgtNWNjN2MxMzRmMzE3IiwiaWF0IjoxNzk1NTQwOTk4LCJycyI6ImVzcG4zIiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.29647cef4bc54aa67d89b239c48782807cfa24f81a6e9a7579bd42d977707415",
          "slug": "espn3",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/espn3",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/espn3",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/espn3"
      }
    },
    "ESPN 4": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://zonurozu.bombrilhoso.lat/docs/navio49/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6Im5hdmlvNDkiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvbmF2aW80OS9pbmRleC50eHQiLCJlIjoxNzk1NTQxMzAwLCJqIjoiNjA3ZDY5NzctNjdlNi00MTk0LThkN2UtODg2ZWQ1YzhhYTJlIiwiaWF0IjoxNzk1NTQxMDAwLCJycyI6ImVzcG40IiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.a019db775d701bbeb4c8bd3666a937b2f51023f0c0c1622c1e52199fa4417bfa",
          "slug": "espn4",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://zonurozu.bombrilhoso.lat/docs/navio49/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6Im5hdmlvNDkiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvbmF2aW80OS9pbmRleC50eHQiLCJlIjoxNzk1NTQxMzAwLCJqIjoiNjA3ZDY5NzctNjdlNi00MTk0LThkN2UtODg2ZWQ1YzhhYTJlIiwiaWF0IjoxNzk1NTQxMDAwLCJycyI6ImVzcG40IiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.a019db775d701bbeb4c8bd3666a937b2f51023f0c0c1622c1e52199fa4417bfa",
          "slug": "espn4",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/espn4",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/espn4",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/espn4"
      }
    },
    "ESPN Extra": {
      "status": "UNAVAILABLE",
      "sources": [],
      "contingency": {
        "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/espn-extra",
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/espnextra"
      }
    },
    "FOX Sports": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://73a017eaa1bb2a452b5bcc92acd54acb.s23-cloudfront-net.lat/8e8e8b142192ea65/espn4.txt",
          "slug": "espn4",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s23-cloudfront-net.lat/8e8e8b142192ea65/espn4.txt",
          "slug": "espn4",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/fox-sports",
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/foxsports"
      }
    },
    "FOX Sports 2": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://novolima.bombrilhoso.lat/docs/cedro15/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImNlZHJvMTUiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvY2Vkcm8xNS9pbmRleC50eHQiLCJlIjoxNzk1NTQxMzAzLCJqIjoiMWQ3MTcwYjktMzc4YS00ZjljLWIyOGEtZjY1MmZlMDU4MWM5IiwiaWF0IjoxNzk1NTQxMDAzLCJycyI6ImVzcG41IiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.d3213e05703a3be8c321ba4984108d2371fc77d3108db704f9b6ecff5d2be999",
          "slug": "espn5",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://novolima.bombrilhoso.lat/docs/cedro15/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImNlZHJvMTUiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvY2Vkcm8xNS9pbmRleC50eHQiLCJlIjoxNzk1NTQxMzAzLCJqIjoiMWQ3MTcwYjktMzc4YS00ZjljLWIyOGEtZjY1MmZlMDU4MWM5IiwiaWF0IjoxNzk1NTQxMDAzLCJycyI6ImVzcG41IiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.d3213e05703a3be8c321ba4984108d2371fc77d3108db704f9b6ecff5d2be999",
          "slug": "espn5",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/foxsports2",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/espn5",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/espn5"
      }
    },
    "BandSports": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://macaniburo.bombrilhoso.lat/docs/kiwi53/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6Imtpd2k1MyIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9raXdpNTMvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTMwNSwiaiI6ImUwMjBmODA2LTg5MmUtNDgwNC04OTk2LWY1ZmNmODgwZmUyNiIsImlhdCI6MTc5NTU0MTAwNSwicnMiOiJiYW5kc3BvcnRzIiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.f94bded1a23c99eef884535f87e4457cf5edbe9b3938994ad07fa0d12eff1643",
          "slug": "bandsports",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://macaniburo.bombrilhoso.lat/docs/kiwi53/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6Imtpd2k1MyIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9raXdpNTMvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTMwNSwiaiI6ImUwMjBmODA2LTg5MmUtNDgwNC04OTk2LWY1ZmNmODgwZmUyNiIsImlhdCI6MTc5NTU0MTAwNSwicnMiOiJiYW5kc3BvcnRzIiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.f94bded1a23c99eef884535f87e4457cf5edbe9b3938994ad07fa0d12eff1643",
          "slug": "bandsports",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/bandsports",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/bandsports",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/bandsports"
      }
    },
    "CazéTV": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/d5ed9893dbf241347da26ddf5264b767/error.txt",
          "slug": "caze1",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/d5ed9893dbf241347da26ddf5264b767/error.txt",
          "slug": "caze1",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1 (EmbedCanais)": "https://embedcanaisdetv.xyz/e/index.php?canal=cazetv/",
        "Servidor 2": "https://embedcanaisdetv.xyz/e/index.php?canal=cazetv2/",
        "Servidor 3": "https://embedcanaisdetv.xyz/e/index.php?canal=cazetv3/",
        "Servidor 4 (EmbedTV)": "https://w7.embedtv.lat/caze1",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/caze1"
      }
    },
    "Combate": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://didatufaca.bombrilhoso.lat/docs/ambar90/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImFtYmFyOTAiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvYW1iYXI5MC9pbmRleC50eHQiLCJlIjoxNzk1NTQxMzI2LCJqIjoiZjllZjQ4ZmQtYzIzYS00Y2M4LTljOWYtM2M1OTE1MGFjMDI3IiwiaWF0IjoxNzk1NTQxMDI2LCJycyI6ImNvbWJhdGUiLCJuYiI6IjJmZTA2MmY5MTYwZTZkNzUxMDBmZWNiMzIxMGUwODE5ZTJkY2ZmMTc1YmVmZjE1ZGI3YTAwZjM1M2M2NWU3ZjciLCJuZiI6Nn0.aa1d4efb020d9877d55f4ec3f5359decb1c12f2ce95fb2513df66b8a40922064",
          "slug": "combate",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://didatufaca.bombrilhoso.lat/docs/ambar90/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImFtYmFyOTAiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvYW1iYXI5MC9pbmRleC50eHQiLCJlIjoxNzk1NTQxMzI2LCJqIjoiZjllZjQ4ZmQtYzIzYS00Y2M4LTljOWYtM2M1OTE1MGFjMDI3IiwiaWF0IjoxNzk1NTQxMDI2LCJycyI6ImNvbWJhdGUiLCJuYiI6IjJmZTA2MmY5MTYwZTZkNzUxMDBmZWNiMzIxMGUwODE5ZTJkY2ZmMTc1YmVmZjE1ZGI3YTAwZjM1M2M2NWU3ZjciLCJuZiI6Nn0.aa1d4efb020d9877d55f4ec3f5359decb1c12f2ce95fb2513df66b8a40922064",
          "slug": "combate",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/combate",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/combate",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/combate"
      }
    },
    "UFC Fight Pass": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://papeculefa.bombrilhoso.lat/docs/quartzo12/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InF1YXJ0em8xMiIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9xdWFydHpvMTIvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTMyOCwiaiI6Ijc1MzFmODVlLTkzNmYtNDM0OC05MDhjLWNkODRjZjQ0ZDVmOSIsImlhdCI6MTc5NTU0MTAyOCwicnMiOiJ1ZmMiLCJuYiI6IjJmZTA2MmY5MTYwZTZkNzUxMDBmZWNiMzIxMGUwODE5ZTJkY2ZmMTc1YmVmZjE1ZGI3YTAwZjM1M2M2NWU3ZjciLCJuZiI6Nn0.7de1907c47acebe80d392137979829bf484f2dc5dfa26d12de36ed254f4aa183",
          "slug": "ufcfightpass",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://papeculefa.bombrilhoso.lat/docs/quartzo12/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InF1YXJ0em8xMiIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9xdWFydHpvMTIvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTMyOCwiaiI6Ijc1MzFmODVlLTkzNmYtNDM0OC05MDhjLWNkODRjZjQ0ZDVmOSIsImlhdCI6MTc5NTU0MTAyOCwicnMiOiJ1ZmMiLCJuYiI6IjJmZTA2MmY5MTYwZTZkNzUxMDBmZWNiMzIxMGUwODE5ZTJkY2ZmMTc1YmVmZjE1ZGI3YTAwZjM1M2M2NWU3ZjciLCJuZiI6Nn0.7de1907c47acebe80d392137979829bf484f2dc5dfa26d12de36ed254f4aa183",
          "slug": "ufcfightpass",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 3 (MeuPlayer)": "https://meuplayeronlinehd.com/myplay/watch.html?id=paramount1",
        "Servidor 4 (EmbedTV)": "https://w7.embedtv.lat/ufcfightpass",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/ufcfightpass",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/ufcfightpass"
      }
    },
    "XSports": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://zutesite.bombrilhoso.lat/docs/palermo42/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InBhbGVybW80MiIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9wYWxlcm1vNDIvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTMyOSwiaiI6IjMwMDVmZDY5LTcxOTYtNDAxOC05ODY0LTY1ZmI3YzRjMjQ1ZiIsImlhdCI6MTc5NTU0MTAyOSwicnMiOiJ4c3BvcnRzIiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.365a687f1de53268f4becfed03272c432c94af32e14efc9799c46ff0a425e3dc",
          "slug": "xsports",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://zutesite.bombrilhoso.lat/docs/palermo42/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InBhbGVybW80MiIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9wYWxlcm1vNDIvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTMyOSwiaiI6IjMwMDVmZDY5LTcxOTYtNDAxOC05ODY0LTY1ZmI3YzRjMjQ1ZiIsImlhdCI6MTc5NTU0MTAyOSwicnMiOiJ4c3BvcnRzIiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.365a687f1de53268f4becfed03272c432c94af32e14efc9799c46ff0a425e3dc",
          "slug": "xsports",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1 (EmbedCanais)": "https://embedcanaisdetv.xyz/e/index.php?canal=xsports",
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/xsports",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/xsports",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/xsports"
      }
    }
  },
  "Filmes & Séries": {
    "HBO": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://pubepudu.bombrilhoso.lat/docs/avelar62/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImF2ZWxhcjYyIiwicCI6InBlbnRlcm9zYS5sYXQiLCJwYXRoIjoiL2F2ZWxhcjYyL2luZGV4LnR4dCIsImUiOjE3OTU1NDEzMzIsImoiOiI1MDg0ODQwZC02M2FmLTRmNDAtYTU5NC1iZTU4NGZkYjM1YWMiLCJpYXQiOjE3OTU1NDEwMzIsInJzIjoiaGJvIiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.ba32fd7b79f2c2313fa9e6fa07aa983688604255a8248980e3d1b29cc962ab3b",
          "slug": "hbo",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://pubepudu.bombrilhoso.lat/docs/avelar62/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImF2ZWxhcjYyIiwicCI6InBlbnRlcm9zYS5sYXQiLCJwYXRoIjoiL2F2ZWxhcjYyL2luZGV4LnR4dCIsImUiOjE3OTU1NDEzMzIsImoiOiI1MDg0ODQwZC02M2FmLTRmNDAtYTU5NC1iZTU4NGZkYjM1YWMiLCJpYXQiOjE3OTU1NDEwMzIsInJzIjoiaGJvIiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.ba32fd7b79f2c2313fa9e6fa07aa983688604255a8248980e3d1b29cc962ab3b",
          "slug": "hbo",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/hbo",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/hbo",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/hbo"
      }
    },
    "HBO 2": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://nufalodu.bombrilhoso.lat/docs/nobreza18/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6Im5vYnJlemExOCIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9ub2JyZXphMTgvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTMzNCwiaiI6IjQ3MTgwMzAzLTc2YzQtNDA1NC1hZmRhLTZhZWZjNzU0MWUzNyIsImlhdCI6MTc5NTU0MTAzNCwicnMiOiJoYm8yIiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.61ac5a302e2b93afea03d56ea812c8735fdc4be8226b6a46e6939f592a5bb284",
          "slug": "hbo2",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://nufalodu.bombrilhoso.lat/docs/nobreza18/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6Im5vYnJlemExOCIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9ub2JyZXphMTgvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTMzNCwiaiI6IjQ3MTgwMzAzLTc2YzQtNDA1NC1hZmRhLTZhZWZjNzU0MWUzNyIsImlhdCI6MTc5NTU0MTAzNCwicnMiOiJoYm8yIiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.61ac5a302e2b93afea03d56ea812c8735fdc4be8226b6a46e6939f592a5bb284",
          "slug": "hbo2",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/hbo2",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/hbo2",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/hbo2"
      }
    },
    "HBO Plus": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://legogadabo.bombrilhoso.lat/docs/riacho27/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InJpYWNobzI3IiwicCI6InBlbnRlcm9zYS5sYXQiLCJwYXRoIjoiL3JpYWNobzI3L2luZGV4LnR4dCIsImUiOjE3OTU1NDEzMzYsImoiOiIwYTZmZmRmNC1kMThmLTQ4NzMtYTg1My01NmNiOTRmMWJhYzUiLCJpYXQiOjE3OTU1NDEwMzYsInJzIjoiaGJvcGx1cyIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.9dd3de1cc1f8b06e9962f81c92cbee3e336b358c66a96470173fad3eec42b790",
          "slug": "hboplus",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://legogadabo.bombrilhoso.lat/docs/riacho27/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InJpYWNobzI3IiwicCI6InBlbnRlcm9zYS5sYXQiLCJwYXRoIjoiL3JpYWNobzI3L2luZGV4LnR4dCIsImUiOjE3OTU1NDEzMzYsImoiOiIwYTZmZmRmNC1kMThmLTQ4NzMtYTg1My01NmNiOTRmMWJhYzUiLCJpYXQiOjE3OTU1NDEwMzYsInJzIjoiaGJvcGx1cyIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.9dd3de1cc1f8b06e9962f81c92cbee3e336b358c66a96470173fad3eec42b790",
          "slug": "hboplus",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/hboplus",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/hboplus",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/hboplus"
      }
    },
    "HBO Signature": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://73a017eaa1bb2a452b5bcc92acd54acb.s23-cloudfront-net.lat/8e8e8b142192ea65/hbo.txt",
          "slug": "hbo",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s23-cloudfront-net.lat/8e8e8b142192ea65/hbo.txt",
          "slug": "hbo",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/hbo-signature",
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/hbosignature"
      }
    },
    "HBO Family": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://zadifile.bombrilhoso.lat/docs/lirio96/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImxpcmlvOTYiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvbGlyaW85Ni9pbmRleC50eHQiLCJlIjoxNzk1NTQxMzM3LCJqIjoiOWY4YmRhNWMtZDY0MC00N2EwLWJmZGQtNjgwODc1NGY3ODQ0IiwiaWF0IjoxNzk1NTQxMDM3LCJycyI6Imhib2ZhbWlseSIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.0ac122867f4689991b0c6ac3cc779cac82f45daa365bc22b62a756ef81627d71",
          "slug": "hbofamily",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://zadifile.bombrilhoso.lat/docs/lirio96/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImxpcmlvOTYiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvbGlyaW85Ni9pbmRleC50eHQiLCJlIjoxNzk1NTQxMzM3LCJqIjoiOWY4YmRhNWMtZDY0MC00N2EwLWJmZGQtNjgwODc1NGY3ODQ0IiwiaWF0IjoxNzk1NTQxMDM3LCJycyI6Imhib2ZhbWlseSIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.0ac122867f4689991b0c6ac3cc779cac82f45daa365bc22b62a756ef81627d71",
          "slug": "hbofamily",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/hbofamily",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/hbofamily",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/hbofamily"
      }
    },
    "Comedy Central": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/911520632b59c3fa9b38edd383832d4a/error.txt",
          "slug": "comedycentral",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/911520632b59c3fa9b38edd383832d4a/error.txt",
          "slug": "comedycentral",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/comedycentral",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/comedycentral"
      }
    },
    "FOX (Star Channel)": {
      "status": "UNAVAILABLE",
      "sources": [],
      "contingency": {
        "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/star-channel",
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/starchannel"
      }
    },
    "Disney+": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://neteburu.bombrilhoso.lat/docs/sincero85/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InNpbmNlcm84NSIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9zaW5jZXJvODUvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTM1OCwiaiI6IjZhNzQzNDM3LTVjMjgtNGQ5Mi04YzhjLWEyMjRhYmJkODI2OSIsImlhdCI6MTc5NTU0MTA1OCwicnMiOiJkaXNuZXlwbHVzMSIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.9601e09b051bb34fec9e60dedfe7977cca2314cd95139800bf982d7659bef305",
          "slug": "disneyplus1",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://neteburu.bombrilhoso.lat/docs/sincero85/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InNpbmNlcm84NSIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9zaW5jZXJvODUvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTM1OCwiaiI6IjZhNzQzNDM3LTVjMjgtNGQ5Mi04YzhjLWEyMjRhYmJkODI2OSIsImlhdCI6MTc5NTU0MTA1OCwicnMiOiJkaXNuZXlwbHVzMSIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.9601e09b051bb34fec9e60dedfe7977cca2314cd95139800bf982d7659bef305",
          "slug": "disneyplus1",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1": "https://embedcanaisdetv.xyz/e/index.php?canal=disneyplus/",
        "Servidor 2": "https://embedcanaisdetv.xyz/e/index.php?canal=disneyplus02/",
        "Servidor 3": "https://embedcanaisdetv.xyz/e/index.php?canal=disneyplus03/",
        "Servidor 4 (EmbedTV)": "https://w7.embedtv.lat/disneyplus1",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/disneyplus1",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/disneyplus1"
      }
    },
    "Max": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://raginasu.bombrilhoso.lat/docs/canela39/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImNhbmVsYTM5IiwicCI6InBlbnRlcm9zYS5sYXQiLCJwYXRoIjoiL2NhbmVsYTM5L2luZGV4LnR4dCIsImUiOjE3OTU1NDEzNjAsImoiOiI2ZjdhMDg1OS1iMTczLTRkZmYtOTVlZi04YzEzNWQ5M2JlYzIiLCJpYXQiOjE3OTU1NDEwNjAsInJzIjoibWF4MSIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.17ccfd443945a866945069c63ed0226a14d34cf01585d334768fe4fc6e8e0ad0",
          "slug": "max1",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://raginasu.bombrilhoso.lat/docs/canela39/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImNhbmVsYTM5IiwicCI6InBlbnRlcm9zYS5sYXQiLCJwYXRoIjoiL2NhbmVsYTM5L2luZGV4LnR4dCIsImUiOjE3OTU1NDEzNjAsImoiOiI2ZjdhMDg1OS1iMTczLTRkZmYtOTVlZi04YzEzNWQ5M2JlYzIiLCJpYXQiOjE3OTU1NDEwNjAsInJzIjoibWF4MSIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.17ccfd443945a866945069c63ed0226a14d34cf01585d334768fe4fc6e8e0ad0",
          "slug": "max1",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1": "https://embedcanaisdetv.xyz/e/index.php?canal=max/",
        "Servidor 2": "https://embedcanaisdetv.xyz/e/index.php?canal=max02/",
        "Servidor 3": "https://embedcanaisdetv.xyz/e/index.php?canal=max03/",
        "Servidor 4 (EmbedTV)": "https://w7.embedtv.lat/max1",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/max1",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/max1"
      }
    },
    "Paramount+": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/ba891eac7dbdb68e6339a597d6d63bac/error.txt",
          "slug": "paramountplus",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/ba891eac7dbdb68e6339a597d6d63bac/error.txt",
          "slug": "paramountplus",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1": "https://embedcanaisdetv.xyz/e/index.php?canal=paramountplus/",
        "Servidor 2": "https://embedcanaisdetv.xyz/e/index.php?canal=paramountplus02/",
        "Servidor 3": "https://embedcanaisdetv.xyz/e/index.php?canal=paramountplus03/",
        "Servidor 4 (EmbedTV)": "https://w7.embedtv.lat/paramountplus",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/paramountplus"
      }
    },
    "Prime Video": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://cenavavobo.bombrilhoso.lat/docs/varanda15/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InZhcmFuZGExNSIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii92YXJhbmRhMTUvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTM4MCwiaiI6ImY1YmZmOWZmLTc2NTYtNGRlOS1hNjQ4LTk3OTgxODUyMTc4ZSIsImlhdCI6MTc5NTU0MTA4MCwicnMiOiJwcmltZXZpZGVvIiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.ad2f2544e5be49b1b2de60f827231948dc70f10f27ce4ca992dfcfbbaf9626e3",
          "slug": "primevideo",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://cenavavobo.bombrilhoso.lat/docs/varanda15/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InZhcmFuZGExNSIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii92YXJhbmRhMTUvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTM4MCwiaiI6ImY1YmZmOWZmLTc2NTYtNGRlOS1hNjQ4LTk3OTgxODUyMTc4ZSIsImlhdCI6MTc5NTU0MTA4MCwicnMiOiJwcmltZXZpZGVvIiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.ad2f2544e5be49b1b2de60f827231948dc70f10f27ce4ca992dfcfbbaf9626e3",
          "slug": "primevideo",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1": "https://embedcanaisdetv.xyz/e/index.php?canal=amazonprimevideo",
        "Servidor 2": "https://embedcanaisdetv.xyz/e/index.php?canal=amazonprimevideo02",
        "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/primevideo",
        "Servidor 4 (EmbedTV)": "https://w7.embedtv.lat/primevideo2",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/primevideo",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/primevideo"
      }
    }
  },
  "Infantil": {
    "Cartoon Network": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://copopivo.bombrilhoso.lat/docs/quimera90/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InF1aW1lcmE5MCIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9xdWltZXJhOTAvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTM4MywiaiI6ImQ5ODRiN2FlLTYzNWMtNDYxMy04OTM2LTVmMzQ4NjJjZGE3YiIsImlhdCI6MTc5NTU0MTA4MywicnMiOiJjYXJ0b29ubmV0d29yayIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.cfd737e2c59326eabacaca1e4e5f2e7d7388d78c5fde966ee62b0598e8afcb97",
          "slug": "cartoonnetwork",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://copopivo.bombrilhoso.lat/docs/quimera90/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InF1aW1lcmE5MCIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9xdWltZXJhOTAvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTM4MywiaiI6ImQ5ODRiN2FlLTYzNWMtNDYxMy04OTM2LTVmMzQ4NjJjZGE3YiIsImlhdCI6MTc5NTU0MTA4MywicnMiOiJjYXJ0b29ubmV0d29yayIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.cfd737e2c59326eabacaca1e4e5f2e7d7388d78c5fde966ee62b0598e8afcb97",
          "slug": "cartoonnetwork",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/cartoonnetwork",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/cartoonnetwork",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/cartoonnetwork"
      }
    },
    "Cartoonito": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://finodebiro.bombrilhoso.lat/docs/duna25/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImR1bmEyNSIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9kdW5hMjUvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTM4NSwiaiI6IjM4N2UxOTZkLWNkM2UtNDc5Zi04OWVmLTIyMDRkYjMwZTExMyIsImlhdCI6MTc5NTU0MTA4NSwicnMiOiJjYXJ0b29uaXRvIiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.d9295578e8fb5df586a1a385be1b46437c374c315ca9f8fff4623a9bf3beec2c",
          "slug": "cartoonito",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://finodebiro.bombrilhoso.lat/docs/duna25/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImR1bmEyNSIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9kdW5hMjUvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTM4NSwiaiI6IjM4N2UxOTZkLWNkM2UtNDc5Zi04OWVmLTIyMDRkYjMwZTExMyIsImlhdCI6MTc5NTU0MTA4NSwicnMiOiJjYXJ0b29uaXRvIiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.d9295578e8fb5df586a1a385be1b46437c374c315ca9f8fff4623a9bf3beec2c",
          "slug": "cartoonito",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/cartoonito",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/cartoonito",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/cartoonito"
      }
    },
    "Boomerang": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://73a017eaa1bb2a452b5bcc92acd54acb.s23-cloudfront-net.lat/8e8e8b142192ea65/cartoonito.txt",
          "slug": "cartoonito",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s23-cloudfront-net.lat/8e8e8b142192ea65/cartoonito.txt",
          "slug": "cartoonito",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/boomerang",
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/boomerang"
      }
    },
    "Disney Channel": {
      "status": "UNAVAILABLE",
      "sources": [],
      "contingency": {
        "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/disney-channel",
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/disneychannel"
      }
    },
    "Disney Junior": {
      "status": "UNAVAILABLE",
      "sources": [],
      "contingency": {
        "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/disney-junior",
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/disneyjunior"
      }
    },
    "Disney XD": {
      "status": "UNAVAILABLE",
      "sources": [],
      "contingency": {
        "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/disney-xd",
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/disneyxd"
      }
    },
    "DreamWorks TV": {
      "status": "UNAVAILABLE",
      "sources": [],
      "contingency": {
        "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/dreamworks",
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/dreamworks"
      }
    },
    "Nickelodeon": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/b226ccc98c0e6f423d2a120629d197b2/error.txt",
          "slug": "nickelodeon",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/b226ccc98c0e6f423d2a120629d197b2/error.txt",
          "slug": "nickelodeon",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/nickelodeon",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/nickelodeon"
      }
    },
    "Nick Jr.": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/fc8019f718f7ca806f39a2ed863e92ad/error.txt",
          "slug": "nickjr",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/fc8019f718f7ca806f39a2ed863e92ad/error.txt",
          "slug": "nickjr",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/nickjr",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/nickjr"
      }
    },
    "Discovery Kids": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://mosegocu.bombrilhoso.lat/docs/lacuna38/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImxhY3VuYTM4IiwicCI6InBlbnRlcm9zYS5sYXQiLCJwYXRoIjoiL2xhY3VuYTM4L2luZGV4LnR4dCIsImUiOjE3OTU1NDE0MjUsImoiOiJlNmZjZDU1Yi1jMGQzLTQyOTktOGFlZC0wMGQxMzM3ZDI2YzQiLCJpYXQiOjE3OTU1NDExMjUsInJzIjoiZGlzY292ZXJ5a2lkcyIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.8f77ce9f2eadc70e4c81abd4d41fe15e55080ef609834824bf04f0e38ac9ff04",
          "slug": "discoverykids",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://mosegocu.bombrilhoso.lat/docs/lacuna38/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImxhY3VuYTM4IiwicCI6InBlbnRlcm9zYS5sYXQiLCJwYXRoIjoiL2xhY3VuYTM4L2luZGV4LnR4dCIsImUiOjE3OTU1NDE0MjUsImoiOiJlNmZjZDU1Yi1jMGQzLTQyOTktOGFlZC0wMGQxMzM3ZDI2YzQiLCJpYXQiOjE3OTU1NDExMjUsInJzIjoiZGlzY292ZXJ5a2lkcyIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.8f77ce9f2eadc70e4c81abd4d41fe15e55080ef609834824bf04f0e38ac9ff04",
          "slug": "discoverykids",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/discoverykids",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/discoverykids",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/discoverykids"
      }
    },
    "Gloob": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://cilosoregi.bombrilhoso.lat/docs/ambar35/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImFtYmFyMzUiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvYW1iYXIzNS9pbmRleC50eHQiLCJlIjoxNzk1NTQxNDI4LCJqIjoiNjQzMzNlYzYtOWJiNC00NTExLWIxNGYtMGZjNDk3ZTYxZTEyIiwiaWF0IjoxNzk1NTQxMTI4LCJycyI6Imdsb29iIiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.d976d4d062475d0c974e0193474ae880e6f09d23aa8aad054dba9b7aa13ef0a0",
          "slug": "gloob",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://cilosoregi.bombrilhoso.lat/docs/ambar35/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImFtYmFyMzUiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvYW1iYXIzNS9pbmRleC50eHQiLCJlIjoxNzk1NTQxNDI4LCJqIjoiNjQzMzNlYzYtOWJiNC00NTExLWIxNGYtMGZjNDk3ZTYxZTEyIiwiaWF0IjoxNzk1NTQxMTI4LCJycyI6Imdsb29iIiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.d976d4d062475d0c974e0193474ae880e6f09d23aa8aad054dba9b7aa13ef0a0",
          "slug": "gloob",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/gloob",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/gloob",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/gloob"
      }
    },
    "Gloobinho": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://73a017eaa1bb2a452b5bcc92acd54acb.s23-cloudfront-net.lat/8e8e8b142192ea65/gloob.txt",
          "slug": "gloob",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s23-cloudfront-net.lat/8e8e8b142192ea65/gloob.txt",
          "slug": "gloob",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/gloobinho",
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/gloobinho"
      }
    }
  },
  "Documentários & Variedades": {
    "Discovery Channel": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://putofezufe.bombrilhoso.lat/docs/topazio24/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InRvcGF6aW8yNCIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii90b3BhemlvMjQvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTQzMCwiaiI6IjNhOTllOGY2LTkxMTYtNGI3Mi04OWNkLTJlZmM4MWNiMmEzNCIsImlhdCI6MTc5NTU0MTEzMCwicnMiOiJkaXNjb3ZlcnljaGFubmVsIiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.143a2f673eb73f93d1ab20d487ef290eea281cf20e27fe6b68141e0e5c7b64d5",
          "slug": "discoverychannel",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://putofezufe.bombrilhoso.lat/docs/topazio24/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InRvcGF6aW8yNCIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii90b3BhemlvMjQvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTQzMCwiaiI6IjNhOTllOGY2LTkxMTYtNGI3Mi04OWNkLTJlZmM4MWNiMmEzNCIsImlhdCI6MTc5NTU0MTEzMCwicnMiOiJkaXNjb3ZlcnljaGFubmVsIiwibmIiOiIyZmUwNjJmOTE2MGU2ZDc1MTAwZmVjYjMyMTBlMDgxOWUyZGNmZjE3NWJlZmYxNWRiN2EwMGYzNTNjNjVlN2Y3IiwibmYiOjZ9.143a2f673eb73f93d1ab20d487ef290eea281cf20e27fe6b68141e0e5c7b64d5",
          "slug": "discoverychannel",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/discoverychannel",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/discoverychannel",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/discoverychannel"
      }
    },
    "Animal Planet": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://rigibari.bombrilhoso.lat/docs/alameda66/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImFsYW1lZGE2NiIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9hbGFtZWRhNjYvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTQzMiwiaiI6Ijc2YWZmMmQwLWI2ODMtNDJjMS04YTdiLWM3MTFkZGJmOGZkMiIsImlhdCI6MTc5NTU0MTEzMiwicnMiOiJhbmltYWxwbGFuZXQiLCJuYiI6IjJmZTA2MmY5MTYwZTZkNzUxMDBmZWNiMzIxMGUwODE5ZTJkY2ZmMTc1YmVmZjE1ZGI3YTAwZjM1M2M2NWU3ZjciLCJuZiI6Nn0.4f4a38c78e11fa5b263bf4a17dc5e622d7235612c503c0534a9997b02ec2f6ff",
          "slug": "animalplanet",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://rigibari.bombrilhoso.lat/docs/alameda66/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImFsYW1lZGE2NiIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9hbGFtZWRhNjYvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTQzMiwiaiI6Ijc2YWZmMmQwLWI2ODMtNDJjMS04YTdiLWM3MTFkZGJmOGZkMiIsImlhdCI6MTc5NTU0MTEzMiwicnMiOiJhbmltYWxwbGFuZXQiLCJuYiI6IjJmZTA2MmY5MTYwZTZkNzUxMDBmZWNiMzIxMGUwODE5ZTJkY2ZmMTc1YmVmZjE1ZGI3YTAwZjM1M2M2NWU3ZjciLCJuZiI6Nn0.4f4a38c78e11fa5b263bf4a17dc5e622d7235612c503c0534a9997b02ec2f6ff",
          "slug": "animalplanet",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/animalplanet",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/animalplanet",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/animalplanet"
      }
    },
    "National Geographic": {
      "status": "UNAVAILABLE",
      "sources": [],
      "contingency": {
        "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/national-geographic",
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/nationalgeographic"
      }
    },
    "NatGeo Wild": {
      "status": "UNAVAILABLE",
      "sources": [],
      "contingency": {
        "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/natgeo-wild",
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/natgeowild"
      }
    },
    "NatGeo Kids": {
      "status": "UNAVAILABLE",
      "sources": [],
      "contingency": {
        "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/natgeo-kids",
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/natgeokids"
      }
    },
    "GloboNews": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://fenidocave.bombrilhoso.lat/docs/esmeril94/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImVzbWVyaWw5NCIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9lc21lcmlsOTQvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTQzNCwiaiI6ImZkZWEyYjE5LTgyNzAtNDg2ZS1iNjQzLTc1YjVjNmZkMmYxMSIsImlhdCI6MTc5NTU0MTEzNCwicnMiOiJnbG9ib25ld3MiLCJuYiI6IjJmZTA2MmY5MTYwZTZkNzUxMDBmZWNiMzIxMGUwODE5ZTJkY2ZmMTc1YmVmZjE1ZGI3YTAwZjM1M2M2NWU3ZjciLCJuZiI6Nn0.e74de9dea9d1c16acf144b8045b1a615bbc807b35f5b5c65aa30a884a577cc19",
          "slug": "globonews",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://fenidocave.bombrilhoso.lat/docs/esmeril94/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImVzbWVyaWw5NCIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9lc21lcmlsOTQvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTQzNCwiaiI6ImZkZWEyYjE5LTgyNzAtNDg2ZS1iNjQzLTc1YjVjNmZkMmYxMSIsImlhdCI6MTc5NTU0MTEzNCwicnMiOiJnbG9ib25ld3MiLCJuYiI6IjJmZTA2MmY5MTYwZTZkNzUxMDBmZWNiMzIxMGUwODE5ZTJkY2ZmMTc1YmVmZjE1ZGI3YTAwZjM1M2M2NWU3ZjciLCJuZiI6Nn0.e74de9dea9d1c16acf144b8045b1a615bbc807b35f5b5c65aa30a884a577cc19",
          "slug": "globonews",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1 (EmbedCanais)": "https://embedcanaisdetv.xyz/e/index.php?canal=globonews",
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/globonews",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/globonews",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/globonews"
      }
    },
    "BandNews": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://nudafinece.bombrilhoso.lat/docs/quartzo24/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InF1YXJ0em8yNCIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9xdWFydHpvMjQvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTQzNiwiaiI6Ijc5YzdjYWNlLTY5MTktNDk4Ni1iZjViLTNiMWNkNWQ5ZjBkYiIsImlhdCI6MTc5NTU0MTEzNiwicnMiOiJiYW5kbmV3cyIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.8bf81b631c9a99ebc8ba126c9d2956a34e7b6ce5d3be57656458d6f13dd98851",
          "slug": "bandnews",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://nudafinece.bombrilhoso.lat/docs/quartzo24/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InF1YXJ0em8yNCIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9xdWFydHpvMjQvaW5kZXgudHh0IiwiZSI6MTc5NTU0MTQzNiwiaiI6Ijc5YzdjYWNlLTY5MTktNDk4Ni1iZjViLTNiMWNkNWQ5ZjBkYiIsImlhdCI6MTc5NTU0MTEzNiwicnMiOiJiYW5kbmV3cyIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.8bf81b631c9a99ebc8ba126c9d2956a34e7b6ce5d3be57656458d6f13dd98851",
          "slug": "bandnews",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/bandnews",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/bandnews",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/bandnews"
      }
    },
    "Multishow": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://pivuzume.bombrilhoso.lat/docs/cacto50/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImNhY3RvNTAiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvY2FjdG81MC9pbmRleC50eHQiLCJlIjoxNzk1NTQxNDM4LCJqIjoiMTcxZWMyZGEtNDFhMC00NjJhLWFmZjYtODk2ZWZkM2U0ZGVmIiwiaWF0IjoxNzk1NTQxMTM4LCJycyI6Im11bHRpc2hvdyIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.fad35603e03ed44da3d955f20ade2d8a523403b1e08685b6625e446e63704246",
          "slug": "multishow",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://pivuzume.bombrilhoso.lat/docs/cacto50/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImNhY3RvNTAiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvY2FjdG81MC9pbmRleC50eHQiLCJlIjoxNzk1NTQxNDM4LCJqIjoiMTcxZWMyZGEtNDFhMC00NjJhLWFmZjYtODk2ZWZkM2U0ZGVmIiwiaWF0IjoxNzk1NTQxMTM4LCJycyI6Im11bHRpc2hvdyIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.fad35603e03ed44da3d955f20ade2d8a523403b1e08685b6625e446e63704246",
          "slug": "multishow",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/multishow",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/multishow",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/multishow"
      }
    },
    "MTV": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://bivurola.bombrilhoso.lat/docs/cedro18/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImNlZHJvMTgiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvY2Vkcm8xOC9pbmRleC50eHQiLCJlIjoxNzk1NTQxNDQwLCJqIjoiYjlmOGNjMDQtMWFkZi00Y2ZlLWFjOWQtNWVhNjg3NTFmM2VlIiwiaWF0IjoxNzk1NTQxMTQwLCJycyI6Im10diIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.23de2a9d9dc2856fac88bdf66b411905d20691fffa1e801155c2cc68f95e2d47",
          "slug": "mtv",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://bivurola.bombrilhoso.lat/docs/cedro18/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImNlZHJvMTgiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvY2Vkcm8xOC9pbmRleC50eHQiLCJlIjoxNzk1NTQxNDQwLCJqIjoiYjlmOGNjMDQtMWFkZi00Y2ZlLWFjOWQtNWVhNjg3NTFmM2VlIiwiaWF0IjoxNzk1NTQxMTQwLCJycyI6Im10diIsIm5iIjoiMmZlMDYyZjkxNjBlNmQ3NTEwMGZlY2IzMjEwZTA4MTllMmRjZmYxNzViZWZmMTVkYjdhMDBmMzUzYzY1ZTdmNyIsIm5mIjo2fQ.23de2a9d9dc2856fac88bdf66b411905d20691fffa1e801155c2cc68f95e2d47",
          "slug": "mtv",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/mtv",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/mtv",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/mtv"
      }
    }
  },
  "Séries 24h": {
    "Chaves 24h": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/6f388a7154e7416ea5a59528be12bad6/error.txt",
          "slug": "24h_chaves",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/6f388a7154e7416ea5a59528be12bad6/error.txt",
          "slug": "24h_chaves",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "EmbedTV": "https://w7.embedtv.lat/24h_chaves",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/24h_chaves"
      }
    },
    "Dragon Ball 24h": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/1257305f858099dfc9880241490abb3f/error.txt",
          "slug": "24h_dragonball",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/1257305f858099dfc9880241490abb3f/error.txt",
          "slug": "24h_dragonball",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "EmbedTV": "https://w7.embedtv.lat/24h_dragonball",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/24h_dragonball"
      }
    },
    "Naruto 24h": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/d08f36a6c8a9d09fde266aba17be808d/error.txt",
          "slug": "24h_naruto",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/d08f36a6c8a9d09fde266aba17be808d/error.txt",
          "slug": "24h_naruto",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "EmbedTV": "https://w7.embedtv.lat/24h_naruto",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/24h_naruto"
      }
    },
    "Os Simpsons 24h": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/a27aaec06ff102f07f9f053ee2cd5ca2/error.txt",
          "slug": "24h_simpsons",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/a27aaec06ff102f07f9f053ee2cd5ca2/error.txt",
          "slug": "24h_simpsons",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "EmbedTV": "https://w7.embedtv.lat/24h_simpsons",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/24h_simpsons"
      }
    },
    "Pica-Pau 24h": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/0443d979402a4d8a1593427283b35b2c/error.txt",
          "slug": "24h_picapau",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/0443d979402a4d8a1593427283b35b2c/error.txt",
          "slug": "24h_picapau",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "EmbedTV": "https://w7.embedtv.lat/24h_picapau",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/24h_picapau"
      }
    },
    "Friends 24h": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/74535ce7958dfe2de91ee8967d581f85/error.txt",
          "slug": "24h_friends",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/74535ce7958dfe2de91ee8967d581f85/error.txt",
          "slug": "24h_friends",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "EmbedTV": "https://w7.embedtv.lat/24h_friends",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/24h_friends"
      }
    },
    "Todo Mundo Odeia o Chris 24h": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/f4f438aa89d96e5301d57eae90d43f0c/error.txt",
          "slug": "24h_odeiachris",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/f4f438aa89d96e5301d57eae90d43f0c/error.txt",
          "slug": "24h_odeiachris",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "EmbedTV": "https://w7.embedtv.lat/24h_odeiachris",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/24h_odeiachris"
      }
    }
  }
};
