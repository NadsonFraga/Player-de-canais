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
          "name": "Servidor 1 (FHD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/453.m3u8",
          "slug": "globosp",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/452.m3u8",
          "slug": "globosp",
          "cdn": "CDN 2"
        },
        {
          "name": "Servidor 3 (Reserva)",
          "url": "http://apontaaimeupatrao.lat:80/live/65689527/29278256/234262.m3u8",
          "slug": "globosp",
          "cdn": "CDN 3"
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
          "name": "Servidor 1 (FHD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/308227.m3u8",
          "slug": "band",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/308229.m3u8",
          "slug": "band",
          "cdn": "CDN 2"
        },
        {
          "name": "Servidor 3 (Reserva)",
          "url": "http://apontaaimeupatrao.lat:80/live/65689527/29278256/236022.m3u8",
          "slug": "band",
          "cdn": "CDN 3"
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
          "name": "Servidor 1 (FHD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/608.m3u8",
          "slug": "sbt",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/609.m3u8",
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
          "url": "https://bilotenipe.bombrilhoso.lat/docs/incenso45/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImluY2Vuc280NSIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9pbmNlbnNvNDUvaW5kZXgudHh0IiwiZSI6MTc5NTY5NzMxMywiaiI6ImUxNmJkN2FlLTZjOTUtNGUzNy1hZDhkLWZiNDM0OWM2OWFmZCIsImlhdCI6MTc5NTY5NzAxMywicnMiOiJyZWNvcmRzcCIsIm5iIjoiYTdjYmUwYTA4YzE0MmE4YzEwMGZjOGFlYjI0YTZkMDQ4OTdhNzQwNTYwNzBkZjAzYzZhNWVhYTQxODViYTAyYiIsIm5mIjo2fQ.10be96eaf69b7cd494d31fd7325f2b5ce1a577babdb74c1381b951ee4d32dbf8",
          "slug": "recordsp",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://bilotenipe.bombrilhoso.lat/docs/incenso45/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImluY2Vuc280NSIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9pbmNlbnNvNDUvaW5kZXgudHh0IiwiZSI6MTc5NTY5NzMxMywiaiI6ImUxNmJkN2FlLTZjOTUtNGUzNy1hZDhkLWZiNDM0OWM2OWFmZCIsImlhdCI6MTc5NTY5NzAxMywicnMiOiJyZWNvcmRzcCIsIm5iIjoiYTdjYmUwYTA4YzE0MmE4YzEwMGZjOGFlYjI0YTZkMDQ4OTdhNzQwNTYwNzBkZjAzYzZhNWVhYTQxODViYTAyYiIsIm5mIjo2fQ.10be96eaf69b7cd494d31fd7325f2b5ce1a577babdb74c1381b951ee4d32dbf8",
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
    },
    "TV Cultura": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Oficial UOL)",
          "url": "https://player-tvcultura.stream.uol.com.br/live/tvcultura.m3u8",
          "slug": "tvcultura",
          "cdn": "CDN Oficial"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://player-tvcultura.stream.uol.com.br/live/tvcultura.m3u8",
          "slug": "tvcultura",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/tvcultura"
      }
    },
    "Record News": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Oficial Ottera)",
          "url": "https://rnw-rn.otteravision.com/rnw/rn/rnw_rn.m3u8",
          "slug": "recordnews",
          "cdn": "CDN Oficial"
        },
        {
          "name": "Servidor 2 (FHD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/662.m3u8",
          "slug": "recordnews",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/recordnews"
      }
    },
    "Rede Brasil": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Oficial LogicaHost)",
          "url": "https://video09.logicahost.com.br/redebrasiloficial/redebrasiloficial/playlist.m3u8",
          "slug": "redebrasil",
          "cdn": "CDN Oficial"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/redebrasil"
      }
    },
    "TV Câmara": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Oficial Camara Gov)",
          "url": "https://stream3.camara.gov.br/tv1/manifest.m3u8",
          "slug": "tvcamara",
          "cdn": "CDN Oficial"
        }
      ]
    }
  },
  "Esportes": {
    "SporTV": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/318.m3u8",
          "slug": "sportv",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD Alt)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/319.m3u8",
          "slug": "sportv",
          "cdn": "CDN 2"
        },
        {
          "name": "Servidor 3 (Reserva)",
          "url": "http://apontaaimeupatrao.lat:80/live/65689527/29278256/231470.m3u8",
          "slug": "sportv",
          "cdn": "CDN 3"
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/321.m3u8",
          "slug": "sportv2",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD Alt)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/322.m3u8",
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/324.m3u8",
          "slug": "sportv3",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD Alt)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/325.m3u8",
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/354.m3u8",
          "slug": "premiereclubes",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD Alt)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/355.m3u8",
          "slug": "premiereclubes",
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/357.m3u8",
          "slug": "premiere2",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/358.m3u8",
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/360.m3u8",
          "slug": "premiere3",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/361.m3u8",
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
          "name": "Servidor 1 (HD 720p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/364.m3u8",
          "slug": "premiere4",
          "cdn": "CDN 1"
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/366.m3u8",
          "slug": "premiere5",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/367.m3u8",
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/369.m3u8",
          "slug": "premiere6",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/370.m3u8",
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/372.m3u8",
          "slug": "premiere7",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/373.m3u8",
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/354.m3u8",
          "slug": "premiereclubes",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD Alt)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/355.m3u8",
          "slug": "premiereclubes",
          "cdn": "CDN 2"
        },
        {
          "name": "Servidor 3 (Reserva)",
          "url": "http://apontaaimeupatrao.lat:80/live/65689527/29278256/236244.m3u8",
          "slug": "premiereclubes",
          "cdn": "CDN 3"
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/330.m3u8",
          "slug": "espn",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD Alt)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/331.m3u8",
          "slug": "espn",
          "cdn": "CDN 2"
        },
        {
          "name": "Servidor 3 (Reserva)",
          "url": "http://apontaaimeupatrao.lat:80/live/65689527/29278256/231459.m3u8",
          "slug": "espn",
          "cdn": "CDN 3"
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/333.m3u8",
          "slug": "espn2",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD Alt)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/334.m3u8",
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/336.m3u8",
          "slug": "espn3",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD Alt)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/337.m3u8",
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/339.m3u8",
          "slug": "espn4",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD Alt)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/340.m3u8",
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
          "url": "https://fesipige.bombrilhoso.lat/docs/cedro15/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImNlZHJvMTUiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvY2Vkcm8xNS9pbmRleC50eHQiLCJlIjoxNzk1Njk3NDQyLCJqIjoiZTg3MjA5ZGUtYTk3YS00NGUyLTkxNTctMzQ5NzBhOGVhM2IwIiwiaWF0IjoxNzk1Njk3MTQyLCJycyI6ImVzcG41IiwibmIiOiJhN2NiZTBhMDhjMTQyYThjMTAwZmM4YWViMjRhNmQwNDg5N2E3NDA1NjA3MGRmMDNjNmE1ZWFhNDE4NWJhMDJiIiwibmYiOjZ9.61bb543413feeced78cb0a48b3f7578e4569d6e175e10231bd67abd4a4783ffa",
          "slug": "espn5",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://fesipige.bombrilhoso.lat/docs/cedro15/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImNlZHJvMTUiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvY2Vkcm8xNS9pbmRleC50eHQiLCJlIjoxNzk1Njk3NDQyLCJqIjoiZTg3MjA5ZGUtYTk3YS00NGUyLTkxNTctMzQ5NzBhOGVhM2IwIiwiaWF0IjoxNzk1Njk3MTQyLCJycyI6ImVzcG41IiwibmIiOiJhN2NiZTBhMDhjMTQyYThjMTAwZmM4YWViMjRhNmQwNDg5N2E3NDA1NjA3MGRmMDNjNmE1ZWFhNDE4NWJhMDJiIiwibmYiOjZ9.61bb543413feeced78cb0a48b3f7578e4569d6e175e10231bd67abd4a4783ffa",
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/315.m3u8",
          "slug": "bandsports",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD Alt)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/316.m3u8",
          "slug": "bandsports",
          "cdn": "CDN 2"
        },
        {
          "name": "Servidor 3 (Reserva)",
          "url": "http://apontaaimeupatrao.lat:80/live/65689527/29278256/232866.m3u8",
          "slug": "bandsports",
          "cdn": "CDN 3"
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/351.m3u8",
          "slug": "combate",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD Alt)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/352.m3u8",
          "slug": "combate",
          "cdn": "CDN 2"
        },
        {
          "name": "Servidor 3 (Reserva)",
          "url": "http://apontaaimeupatrao.lat:80/live/65689527/29278256/231453.m3u8",
          "slug": "combate",
          "cdn": "CDN 3"
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
          "url": "https://felofuru.bombrilhoso.lat/docs/quartzo12/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InF1YXJ0em8xMiIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9xdWFydHpvMTIvaW5kZXgudHh0IiwiZSI6MTc5NTY5NzQ2NiwiaiI6IjQyNTgzOGQxLTE1YmQtNGE3ZC1hNTQ5LTZiZDdiMjY4YTQwYyIsImlhdCI6MTc5NTY5NzE2NiwicnMiOiJ1ZmMiLCJuYiI6ImE3Y2JlMGEwOGMxNDJhOGMxMDBmYzhhZWIyNGE2ZDA0ODk3YTc0MDU2MDcwZGYwM2M2YTVlYWE0MTg1YmEwMmIiLCJuZiI6Nn0.d89a372fc92a94495a174ef75c4f667414bbdccd7aaaf5be711e9f2e2174a59c",
          "slug": "ufcfightpass",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://felofuru.bombrilhoso.lat/docs/quartzo12/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InF1YXJ0em8xMiIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9xdWFydHpvMTIvaW5kZXgudHh0IiwiZSI6MTc5NTY5NzQ2NiwiaiI6IjQyNTgzOGQxLTE1YmQtNGE3ZC1hNTQ5LTZiZDdiMjY4YTQwYyIsImlhdCI6MTc5NTY5NzE2NiwicnMiOiJ1ZmMiLCJuYiI6ImE3Y2JlMGEwOGMxNDJhOGMxMDBmYzhhZWIyNGE2ZDA0ODk3YTc0MDU2MDcwZGYwM2M2YTVlYWE0MTg1YmEwMmIiLCJuZiI6Nn0.d89a372fc92a94495a174ef75c4f667414bbdccd7aaaf5be711e9f2e2174a59c",
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
          "url": "https://nifupete.bombrilhoso.lat/docs/palermo42/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InBhbGVybW80MiIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9wYWxlcm1vNDIvaW5kZXgudHh0IiwiZSI6MTc5NTY5NzQ2OCwiaiI6IjQ0YTNmNTczLTgzYmItNGIwNi1hOTcwLTVmZGEyZjVkNWFjYSIsImlhdCI6MTc5NTY5NzE2OCwicnMiOiJ4c3BvcnRzIiwibmIiOiJhN2NiZTBhMDhjMTQyYThjMTAwZmM4YWViMjRhNmQwNDg5N2E3NDA1NjA3MGRmMDNjNmE1ZWFhNDE4NWJhMDJiIiwibmYiOjZ9.d0750363795cc5b1e3d5d7a25e6e6410738cf8a6885ba712c9d04ce99c1bbb81",
          "slug": "xsports",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://nifupete.bombrilhoso.lat/docs/palermo42/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InBhbGVybW80MiIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9wYWxlcm1vNDIvaW5kZXgudHh0IiwiZSI6MTc5NTY5NzQ2OCwiaiI6IjQ0YTNmNTczLTgzYmItNGIwNi1hOTcwLTVmZGEyZjVkNWFjYSIsImlhdCI6MTc5NTY5NzE2OCwicnMiOiJ4c3BvcnRzIiwibmIiOiJhN2NiZTBhMDhjMTQyYThjMTAwZmM4YWViMjRhNmQwNDg5N2E3NDA1NjA3MGRmMDNjNmE1ZWFhNDE4NWJhMDJiIiwibmYiOjZ9.d0750363795cc5b1e3d5d7a25e6e6410738cf8a6885ba712c9d04ce99c1bbb81",
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
    },
    "SporTV 4": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/327.m3u8",
          "slug": "sportv4",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/328.m3u8",
          "slug": "sportv4",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/sportv4"
      }
    },
    "F1 TV": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (BandSports F1 FHD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/315.m3u8",
          "slug": "f1tv",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Band SP F1 FHD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/308227.m3u8",
          "slug": "f1tv",
          "cdn": "CDN 2"
        },
        {
          "name": "Servidor 3 (Feed Internacional)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/431.m3u8",
          "slug": "f1tv",
          "cdn": "CDN 3"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/bandsports"
      }
    },
    "Premiere 8": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/375.m3u8",
          "slug": "premiere8",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/376.m3u8",
          "slug": "premiere8",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/premiere8"
      }
    },
    "ESPN 5": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/342.m3u8",
          "slug": "espn5",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/343.m3u8",
          "slug": "espn5",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/espn5"
      }
    },
    "ESPN 6": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/345.m3u8",
          "slug": "espn6",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/346.m3u8",
          "slug": "espn6",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/espn6"
      }
    }
  },
  "Filmes & Séries": {
    "HBO": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/157.m3u8",
          "slug": "hbo",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/158.m3u8",
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/160.m3u8",
          "slug": "hbo2",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/161.m3u8",
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/166.m3u8",
          "slug": "hboplus",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/167.m3u8",
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/175.m3u8",
          "slug": "hbosignature",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/176.m3u8",
          "slug": "hbosignature",
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/163.m3u8",
          "slug": "hbofamily",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/164.m3u8",
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
          "url": "https://derubule.bombrilhoso.lat/docs/sincero85/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InNpbmNlcm84NSIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9zaW5jZXJvODUvaW5kZXgudHh0IiwiZSI6MTc5NTY5ODYxMiwiaiI6IjgwYTljMjE3LTcwMmEtNDk4My1iZGI4LWU3NDhkY2FiNmQxMiIsImlhdCI6MTc5NTY5ODMxMiwicnMiOiJkaXNuZXlwbHVzMSIsIm5iIjoiYTdjYmUwYTA4YzE0MmE4YzEwMGZjOGFlYjI0YTZkMDQ4OTdhNzQwNTYwNzBkZjAzYzZhNWVhYTQxODViYTAyYiIsIm5mIjo2fQ.52c2ea49dd8bbf6a7b3b7466b8a1288654b4524bc672342056e901b781827674",
          "slug": "disneyplus1",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://derubule.bombrilhoso.lat/docs/sincero85/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InNpbmNlcm84NSIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii9zaW5jZXJvODUvaW5kZXgudHh0IiwiZSI6MTc5NTY5ODYxMiwiaiI6IjgwYTljMjE3LTcwMmEtNDk4My1iZGI4LWU3NDhkY2FiNmQxMiIsImlhdCI6MTc5NTY5ODMxMiwicnMiOiJkaXNuZXlwbHVzMSIsIm5iIjoiYTdjYmUwYTA4YzE0MmE4YzEwMGZjOGFlYjI0YTZkMDQ4OTdhNzQwNTYwNzBkZjAzYzZhNWVhYTQxODViYTAyYiIsIm5mIjo2fQ.52c2ea49dd8bbf6a7b3b7466b8a1288654b4524bc672342056e901b781827674",
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
          "url": "https://mulubuda.bombrilhoso.lat/docs/canela39/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImNhbmVsYTM5IiwicCI6InBlbnRlcm9zYS5sYXQiLCJwYXRoIjoiL2NhbmVsYTM5L2luZGV4LnR4dCIsImUiOjE3OTU2OTg2MTQsImoiOiI4NTgzZjNlNi1mMjhkLTRhMGUtYTJkZS03NjZjNjAwMDUzOTEiLCJpYXQiOjE3OTU2OTgzMTQsInJzIjoibWF4MSIsIm5iIjoiYTdjYmUwYTA4YzE0MmE4YzEwMGZjOGFlYjI0YTZkMDQ4OTdhNzQwNTYwNzBkZjAzYzZhNWVhYTQxODViYTAyYiIsIm5mIjo2fQ.59364655b380dd9958ade4ff2fa023b159360e1518a979066b3220bbf8b6f352",
          "slug": "max1",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://mulubuda.bombrilhoso.lat/docs/canela39/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImNhbmVsYTM5IiwicCI6InBlbnRlcm9zYS5sYXQiLCJwYXRoIjoiL2NhbmVsYTM5L2luZGV4LnR4dCIsImUiOjE3OTU2OTg2MTQsImoiOiI4NTgzZjNlNi1mMjhkLTRhMGUtYTJkZS03NjZjNjAwMDUzOTEiLCJpYXQiOjE3OTU2OTgzMTQsInJzIjoibWF4MSIsIm5iIjoiYTdjYmUwYTA4YzE0MmE4YzEwMGZjOGFlYjI0YTZkMDQ4OTdhNzQwNTYwNzBkZjAzYzZhNWVhYTQxODViYTAyYiIsIm5mIjo2fQ.59364655b380dd9958ade4ff2fa023b159360e1518a979066b3220bbf8b6f352",
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
          "url": "https://sadevigofe.bombrilhoso.lat/docs/varanda15/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InZhcmFuZGExNSIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii92YXJhbmRhMTUvaW5kZXgudHh0IiwiZSI6MTc5NTY5ODYxOCwiaiI6Ijc0ZTYwMzRhLTliNTQtNDUxNC1hODc3LTA0NWE2MDk2MzkwNyIsImlhdCI6MTc5NTY5ODMxOCwicnMiOiJwcmltZXZpZGVvIiwibmIiOiJhN2NiZTBhMDhjMTQyYThjMTAwZmM4YWViMjRhNmQwNDg5N2E3NDA1NjA3MGRmMDNjNmE1ZWFhNDE4NWJhMDJiIiwibmYiOjZ9.223cfe760e86a498a46c297c537d269637162e5015c7415c63a03fa96265132a",
          "slug": "primevideo",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://sadevigofe.bombrilhoso.lat/docs/varanda15/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6InZhcmFuZGExNSIsInAiOiJwZW50ZXJvc2EubGF0IiwicGF0aCI6Ii92YXJhbmRhMTUvaW5kZXgudHh0IiwiZSI6MTc5NTY5ODYxOCwiaiI6Ijc0ZTYwMzRhLTliNTQtNDUxNC1hODc3LTA0NWE2MDk2MzkwNyIsImlhdCI6MTc5NTY5ODMxOCwicnMiOiJwcmltZXZpZGVvIiwibmIiOiJhN2NiZTBhMDhjMTQyYThjMTAwZmM4YWViMjRhNmQwNDg5N2E3NDA1NjA3MGRmMDNjNmE1ZWFhNDE4NWJhMDJiIiwibmYiOjZ9.223cfe760e86a498a46c297c537d269637162e5015c7415c63a03fa96265132a",
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
    },
    "Telecine Premium": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/151.m3u8",
          "slug": "telecinepremium",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/152.m3u8",
          "slug": "telecinepremium",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/telecinepremium"
      }
    },
    "Telecine Action": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/139.m3u8",
          "slug": "telecineaction",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/140.m3u8",
          "slug": "telecineaction",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/telecineaction"
      }
    },
    "Telecine Pipoca": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/148.m3u8",
          "slug": "telecinepipoca",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/149.m3u8",
          "slug": "telecinepipoca",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/telecinepipoca"
      }
    },
    "Telecine Fun": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/145.m3u8",
          "slug": "telecinefun",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/146.m3u8",
          "slug": "telecinefun",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/telecinefun"
      }
    },
    "Telecine Touch": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/154.m3u8",
          "slug": "telecinetouch",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/155.m3u8",
          "slug": "telecinetouch",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/telecinetouch"
      }
    },
    "Telecine Cult": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/142.m3u8",
          "slug": "telecinecult",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/143.m3u8",
          "slug": "telecinecult",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/telecinecult"
      }
    },
    "Megapix": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/99.m3u8",
          "slug": "megapix",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/100.m3u8",
          "slug": "megapix",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/megapix"
      }
    },
    "TNT Séries": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/121.m3u8",
          "slug": "tntseries",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/122.m3u8",
          "slug": "tntseries",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/tntseries"
      }
    },
    "TNT Novelas": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/124.m3u8",
          "slug": "tntnovelas",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/125.m3u8",
          "slug": "tntnovelas",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/tntnovelas"
      }
    }
  },
  "Infantil": {
    "Cartoon Network": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/293.m3u8",
          "slug": "cartoonnetwork",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/294.m3u8",
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/290.m3u8",
          "slug": "cartoonito",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/291.m3u8",
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/296.m3u8",
          "slug": "discoverykids",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/297.m3u8",
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/299.m3u8",
          "slug": "gloob",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/300.m3u8",
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/302.m3u8",
          "slug": "gloobinho",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/303.m3u8",
          "slug": "gloobinho",
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/206.m3u8",
          "slug": "discoverychannel",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/207.m3u8",
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/191.m3u8",
          "slug": "animalplanet",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/192.m3u8",
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/656.m3u8",
          "slug": "globonews",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/657.m3u8",
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
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/644.m3u8",
          "slug": "bandnews",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/645.m3u8",
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
          "url": "https://zugubabuba.bombrilhoso.lat/docs/cacto50/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImNhY3RvNTAiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvY2FjdG81MC9pbmRleC50eHQiLCJlIjoxNzk1Njk4NjczLCJqIjoiZGZkNmRiN2EtNzFiYi00OWQ3LTljN2YtYmEzMjJjYzQwMmU2IiwiaWF0IjoxNzk1Njk4MzczLCJycyI6Im11bHRpc2hvdyIsIm5iIjoiYTdjYmUwYTA4YzE0MmE4YzEwMGZjOGFlYjI0YTZkMDQ4OTdhNzQwNTYwNzBkZjAzYzZhNWVhYTQxODViYTAyYiIsIm5mIjo2fQ.c6604e5dc0c6cf33ecf9c4dbcd418d9ab90ad09017df1906825652543fd2fa78",
          "slug": "multishow",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://zugubabuba.bombrilhoso.lat/docs/cacto50/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImNhY3RvNTAiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvY2FjdG81MC9pbmRleC50eHQiLCJlIjoxNzk1Njk4NjczLCJqIjoiZGZkNmRiN2EtNzFiYi00OWQ3LTljN2YtYmEzMjJjYzQwMmU2IiwiaWF0IjoxNzk1Njk4MzczLCJycyI6Im11bHRpc2hvdyIsIm5iIjoiYTdjYmUwYTA4YzE0MmE4YzEwMGZjOGFlYjI0YTZkMDQ4OTdhNzQwNTYwNzBkZjAzYzZhNWVhYTQxODViYTAyYiIsIm5mIjo2fQ.c6604e5dc0c6cf33ecf9c4dbcd418d9ab90ad09017df1906825652543fd2fa78",
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
          "url": "https://dozefeba.bombrilhoso.lat/docs/cedro18/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImNlZHJvMTgiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvY2Vkcm8xOC9pbmRleC50eHQiLCJlIjoxNzk1Njk4Njc1LCJqIjoiNTgxOTE4OTktYzVjMy00ZmZkLWFhZWUtMmQxYWFjNzlhZTRkIiwiaWF0IjoxNzk1Njk4Mzc1LCJycyI6Im10diIsIm5iIjoiYTdjYmUwYTA4YzE0MmE4YzEwMGZjOGFlYjI0YTZkMDQ4OTdhNzQwNTYwNzBkZjAzYzZhNWVhYTQxODViYTAyYiIsIm5mIjo2fQ.02319727580dd0f2e5084a691a63517d01a2d32c6b02f4faa79067608e13f90f",
          "slug": "mtv",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://dozefeba.bombrilhoso.lat/docs/cedro18/__index.txt?token=eyJ2IjoyLCJzdCI6MSwicyI6ImNlZHJvMTgiLCJwIjoicGVudGVyb3NhLmxhdCIsInBhdGgiOiIvY2Vkcm8xOC9pbmRleC50eHQiLCJlIjoxNzk1Njk4Njc1LCJqIjoiNTgxOTE4OTktYzVjMy00ZmZkLWFhZWUtMmQxYWFjNzlhZTRkIiwiaWF0IjoxNzk1Njk4Mzc1LCJycyI6Im10diIsIm5iIjoiYTdjYmUwYTA4YzE0MmE4YzEwMGZjOGFlYjI0YTZkMDQ4OTdhNzQwNTYwNzBkZjAzYzZhNWVhYTQxODViYTAyYiIsIm5mIjo2fQ.02319727580dd0f2e5084a691a63517d01a2d32c6b02f4faa79067608e13f90f",
          "slug": "mtv",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/mtv",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/mtv",
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/mtv"
      }
    },
    "CNN Brasil": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Oficial Cloudfront)",
          "url": "https://d25usgadhphvwi.cloudfront.net/hls/stv-plus1920x1080/playlist.m3u8",
          "slug": "cnnbrasil",
          "cdn": "CDN Oficial"
        },
        {
          "name": "Servidor 2 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/647.m3u8",
          "slug": "cnnbrasil",
          "cdn": "CDN 2"
        },
        {
          "name": "Servidor 3 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/648.m3u8",
          "slug": "cnnbrasil",
          "cdn": "CDN 3"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/cnnbrasil"
      }
    },
    "Jovem Pan News": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (FHD 1080p)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/659.m3u8",
          "slug": "jovempannews",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (HD)",
          "url": "http://rfc-infinite.top/live/91098174/vGBc4fp/660.m3u8",
          "slug": "jovempannews",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/jovempannews"
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
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/24h_chaves"
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
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/24h_dragonball"
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
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/24h_naruto"
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
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/24h_simpsons"
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
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/24h_picapau"
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
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/24h_friends"
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
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/24h_odeiachris"
      }
    },
    "South Park 24h": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Pluto TV)",
          "url": "https://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/607860b798bca4000787a747/master.m3u8?advertisingId=&appName=web&appVersion=na&app_name=web&clientDeviceType=0&deviceDNT=0&deviceId=na&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=na&includeExtendedEvents=false&serverSideAds=false&sid=na",
          "slug": "south_park_24h",
          "cdn": "Pluto TV"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/southpark"
      }
    },
    "MasterChef Brasil 24h": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Pluto TV)",
          "url": "https://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/6051515bb564990007f369f6/master.m3u8?advertisingId=&appName=web&appVersion=na&app_name=web&clientDeviceType=0&deviceDNT=0&deviceId=na&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=na&includeExtendedEvents=false&serverSideAds=false&sid=na",
          "slug": "masterchef_24h",
          "cdn": "Pluto TV"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV / RD)": "https://rdembed.online/masterchef"
      }
    },
    "Star Trek 24h": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Pluto TV)",
          "url": "https://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5fd3d7fc349ff00007817eb4/master.m3u8?advertisingId=&appName=web&appVersion=na&app_name=web&clientDeviceType=0&deviceDNT=0&deviceId=na&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=na&includeExtendedEvents=false&serverSideAds=false&sid=na",
          "slug": "startrek_24h",
          "cdn": "Pluto TV"
        }
      ],
      "contingency": {}
    },
    "Os Trapalhões 24h": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Pluto TV)",
          "url": "https://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/613fd20be0c3130007e9d40a/master.m3u8?advertisingId=&appName=web&appVersion=na&app_name=web&clientDeviceType=0&deviceDNT=0&deviceId=na&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=na&includeExtendedEvents=false&serverSideAds=false&sid=na",
          "slug": "trapalhoes_24h",
          "cdn": "Pluto TV"
        }
      ],
      "contingency": {}
    },
    "Pluto TV Anime 24h": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Pluto TV)",
          "url": "https://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv/stitch/hls/channel/5faac9634960300007c08272/master.m3u8?advertisingId=&appName=web&appVersion=na&app_name=web&clientDeviceType=0&deviceDNT=0&deviceId=na&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=na&includeExtendedEvents=false&serverSideAds=false&sid=na",
          "slug": "pluto_anime_24h",
          "cdn": "Pluto TV"
        }
      ],
      "contingency": {}
    }
  }
};
