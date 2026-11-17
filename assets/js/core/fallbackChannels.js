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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/f877db2cf94825e49e2272b07eb7d743/error.txt",
          "slug": "globosp",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/f877db2cf94825e49e2272b07eb7d743/error.txt",
          "slug": "globosp",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "SP - Backup": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=globosp",
        "RJ - Backup": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=globorj",
        "BA - Backup": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=globoba",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/globosp"
      }
    },
    "Band": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/fd2d8be1f707c16b275acd1b129ec85d/error.txt",
          "slug": "bandsp",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/fd2d8be1f707c16b275acd1b129ec85d/error.txt",
          "slug": "bandsp",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/eventos/band.html?id=019a797e-eeb8-7eda-9518-132403ccb160",
        "Servidor 2": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/eventos/band.html?id=019cc41a-ccc4-75e0-a31f-9bf47fad8d8b",
        "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/bandsp",
        "Servidor 4 (EmbedTV)": "https://w7.embedtv.lat/bandrj",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/bandsp"
      }
    },
    "SBT": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/4e360c6cf79aa73af1dbc422792aa38d/error.txt",
          "slug": "sbt",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/4e360c6cf79aa73af1dbc422792aa38d/error.txt",
          "slug": "sbt",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "SP - Principal": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=sbtsp",
        "RJ - Principal": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=sbtrj",
        "Alternativo": "https://youtube-player.sbt.com.br/?videoID=ABVQXgr2LW4&t=0&adunit=/1011235/SBT_Videos/Especiais/SBT_Live/video",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/sbt"
      }
    },
    "Record": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/28df9ec1f1bb3cac36293e6f86d437bc/error.txt",
          "slug": "recordsp",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/28df9ec1f1bb3cac36293e6f86d437bc/error.txt",
          "slug": "recordsp",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "SP - EmbedTV": "https://w7.embedtv.lat/recordsp",
        "RJ - EmbedTV": "https://w7.embedtv.lat/recordrj",
        "MG - EmbedTV": "https://w7.embedtv.lat/recordmg",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/recordsp"
      }
    }
  },
  "Esportes": {
    "SporTV": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/ee48b7b53f713324bec579020d0f8f77/error.txt",
          "slug": "sportv",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/ee48b7b53f713324bec579020d0f8f77/error.txt",
          "slug": "sportv",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Alternativo": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=sportv",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/sportv"
      }
    },
    "SporTV 2": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/725298091f6136ff43565108fb269e8f/error.txt",
          "slug": "sportv2",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/725298091f6136ff43565108fb269e8f/error.txt",
          "slug": "sportv2",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/sportv2"
      }
    },
    "SporTV 3": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/e5d3489f708fec6f899df2573370c720/error.txt",
          "slug": "sportv3",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/e5d3489f708fec6f899df2573370c720/error.txt",
          "slug": "sportv3",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1 (MeuPlayer)": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/primebr.html?id=sportv3",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/sportv3"
      }
    },
    "Premiere": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/3f247d47300c0498657da2a40f6238a0/error.txt",
          "slug": "premiere",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/3f247d47300c0498657da2a40f6238a0/error.txt",
          "slug": "premiere",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1 (MeuPlayer)": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=premiere",
        "Servidor 4 (EmbedTV)": "https://w7.embedtv.lat/premiere",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/premiere"
      }
    },
    "Premiere 2": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/4410da6386b90add0842946b2c23dff5/error.txt",
          "slug": "premiere2",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/4410da6386b90add0842946b2c23dff5/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/4d27f8157d15b20f50e7927f3a4df6c6/error.txt",
          "slug": "premiere3",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/4d27f8157d15b20f50e7927f3a4df6c6/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/20a6f8f4372379756ff81bc4ea253337/error.txt",
          "slug": "premiere4",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/20a6f8f4372379756ff81bc4ea253337/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/98855951dc35462410d4b4c906b14e8a/error.txt",
          "slug": "premiere5",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/98855951dc35462410d4b4c906b14e8a/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/447241388b45313387c631aa9a2d55d9/error.txt",
          "slug": "premiere6",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/447241388b45313387c631aa9a2d55d9/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/48bc4a42a8c10aaf0fbd3699450be7d8/error.txt",
          "slug": "premiere7",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/48bc4a42a8c10aaf0fbd3699450be7d8/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/087229819293035bfd293ed59d8b928e/error.txt",
          "slug": "espn",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/087229819293035bfd293ed59d8b928e/error.txt",
          "slug": "espn",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/espn",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/espn"
      }
    },
    "ESPN 2": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/1539cab22a2ea08beffb2dc4ba3e8634/error.txt",
          "slug": "espn2",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/1539cab22a2ea08beffb2dc4ba3e8634/error.txt",
          "slug": "espn2",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/espn2",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/espn2"
      }
    },
    "ESPN 3": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/9c82f0d5cc7f25c9e852943fb365f2a3/error.txt",
          "slug": "espn3",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/9c82f0d5cc7f25c9e852943fb365f2a3/error.txt",
          "slug": "espn3",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/espn3",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/espn3"
      }
    },
    "ESPN 4": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/825695dd840d8e117382fd41fc240453/error.txt",
          "slug": "espn4",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/825695dd840d8e117382fd41fc240453/error.txt",
          "slug": "espn4",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/espn4",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/espn4"
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/01493b70614a6fa53c49db34e69d157c/error.txt",
          "slug": "espn5",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/01493b70614a6fa53c49db34e69d157c/error.txt",
          "slug": "espn5",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/foxsports2",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/espn5"
      }
    },
    "BandSports": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/e2f94ac34b4f547fe206e1ab47ffa6de/error.txt",
          "slug": "bandsports",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/e2f94ac34b4f547fe206e1ab47ffa6de/error.txt",
          "slug": "bandsports",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/bandsports",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/bandsports"
      }
    },
    "CazéTV": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/1d4f89eac9df790655591a5d1495f063/error.txt",
          "slug": "caze1",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/1d4f89eac9df790655591a5d1495f063/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/b01662c7d7504d2019f86f387ecd5d7d/error.txt",
          "slug": "combate",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/b01662c7d7504d2019f86f387ecd5d7d/error.txt",
          "slug": "combate",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/combate",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/combate"
      }
    },
    "UFC Fight Pass": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/ac1c30ccddd64bbdc8e04bff4cd4f47e/error.txt",
          "slug": "ufcfightpass",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/ac1c30ccddd64bbdc8e04bff4cd4f47e/error.txt",
          "slug": "ufcfightpass",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 3 (MeuPlayer)": "https://meuplayeronlinehd.com/myplay/watch.html?id=paramount1",
        "Servidor 4 (EmbedTV)": "https://w7.embedtv.lat/ufcfightpass",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/ufcfightpass"
      }
    },
    "XSports": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/f15de62c442fbdd233b679fc04718370/error.txt",
          "slug": "xsports",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/f15de62c442fbdd233b679fc04718370/error.txt",
          "slug": "xsports",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1 (EmbedCanais)": "https://embedcanaisdetv.xyz/e/index.php?canal=xsports",
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/xsports",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/xsports"
      }
    }
  },
  "Filmes & Séries": {
    "HBO": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/2e86edaaceb07fd9300c5c7f20e386c9/error.txt",
          "slug": "hbo",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/2e86edaaceb07fd9300c5c7f20e386c9/error.txt",
          "slug": "hbo",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/hbo",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/hbo"
      }
    },
    "HBO 2": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/6bc3fbe73c51573707c07baee776ea19/error.txt",
          "slug": "hbo2",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/6bc3fbe73c51573707c07baee776ea19/error.txt",
          "slug": "hbo2",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/hbo2",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/hbo2"
      }
    },
    "HBO Plus": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/8ab9e43f4f9ac9b5b19c0c31d34343e8/error.txt",
          "slug": "hboplus",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/8ab9e43f4f9ac9b5b19c0c31d34343e8/error.txt",
          "slug": "hboplus",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/hboplus",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/hboplus"
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/922c358e97d75b9a30b2ed2a9ab9e1b2/error.txt",
          "slug": "hbofamily",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/922c358e97d75b9a30b2ed2a9ab9e1b2/error.txt",
          "slug": "hbofamily",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/hbofamily",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/hbofamily"
      }
    },
    "Comedy Central": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/2bb154fc5f89414a606266aad5892d51/error.txt",
          "slug": "comedycentral",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/2bb154fc5f89414a606266aad5892d51/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/11e7b209ed7c1c99c688cd8e24c8845b/error.txt",
          "slug": "disneyplus1",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/11e7b209ed7c1c99c688cd8e24c8845b/error.txt",
          "slug": "disneyplus1",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1": "https://embedcanaisdetv.xyz/e/index.php?canal=disneyplus/",
        "Servidor 2": "https://embedcanaisdetv.xyz/e/index.php?canal=disneyplus02/",
        "Servidor 3": "https://embedcanaisdetv.xyz/e/index.php?canal=disneyplus03/",
        "Servidor 4 (EmbedTV)": "https://w7.embedtv.lat/disneyplus1",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/disneyplus1"
      }
    },
    "Max": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/2f19522a6c71436b001d125bb1c588a0/error.txt",
          "slug": "max1",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/2f19522a6c71436b001d125bb1c588a0/error.txt",
          "slug": "max1",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1": "https://embedcanaisdetv.xyz/e/index.php?canal=max/",
        "Servidor 2": "https://embedcanaisdetv.xyz/e/index.php?canal=max02/",
        "Servidor 3": "https://embedcanaisdetv.xyz/e/index.php?canal=max03/",
        "Servidor 4 (EmbedTV)": "https://w7.embedtv.lat/max1",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/max1"
      }
    },
    "Paramount+": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/53c9e963e44ce44cdf0bc766c278a8d2/error.txt",
          "slug": "paramountplus",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/53c9e963e44ce44cdf0bc766c278a8d2/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/5a4d287f95294ff78171ad3d1c506ccc/error.txt",
          "slug": "primevideo",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/5a4d287f95294ff78171ad3d1c506ccc/error.txt",
          "slug": "primevideo",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1": "https://embedcanaisdetv.xyz/e/index.php?canal=amazonprimevideo",
        "Servidor 2": "https://embedcanaisdetv.xyz/e/index.php?canal=amazonprimevideo02",
        "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/primevideo",
        "Servidor 4 (EmbedTV)": "https://w7.embedtv.lat/primevideo2",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/primevideo"
      }
    }
  },
  "Infantil": {
    "Cartoon Network": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/57307ea3eb74c917736021f07b5929c4/error.txt",
          "slug": "cartoonnetwork",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/57307ea3eb74c917736021f07b5929c4/error.txt",
          "slug": "cartoonnetwork",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/cartoonnetwork",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/cartoonnetwork"
      }
    },
    "Cartoonito": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/929cf9e5a046dd36ef11653e36d8fce5/error.txt",
          "slug": "cartoonito",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/929cf9e5a046dd36ef11653e36d8fce5/error.txt",
          "slug": "cartoonito",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/cartoonito",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/cartoonito"
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/f265bb33ffef81adb5e386323cad8a3c/error.txt",
          "slug": "nickelodeon",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/f265bb33ffef81adb5e386323cad8a3c/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/38575fdee8ea9fbf21bd800ab36528f3/error.txt",
          "slug": "nickjr",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/38575fdee8ea9fbf21bd800ab36528f3/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/d35002d2c7c01a13188d44dfc59b1d89/error.txt",
          "slug": "discoverykids",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/d35002d2c7c01a13188d44dfc59b1d89/error.txt",
          "slug": "discoverykids",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/discoverykids",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/discoverykids"
      }
    },
    "Gloob": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/9aea7a48600ccb81b24181a02d119e5a/error.txt",
          "slug": "gloob",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/9aea7a48600ccb81b24181a02d119e5a/error.txt",
          "slug": "gloob",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/gloob",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/gloob"
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/74ee2960d7fd7a33d98e0e6f37cf91bd/error.txt",
          "slug": "discoverychannel",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/74ee2960d7fd7a33d98e0e6f37cf91bd/error.txt",
          "slug": "discoverychannel",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/discoverychannel",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/discoverychannel"
      }
    },
    "Animal Planet": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/46790fc2b17d9a8b9097c7ec349a0329/error.txt",
          "slug": "animalplanet",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/46790fc2b17d9a8b9097c7ec349a0329/error.txt",
          "slug": "animalplanet",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/animalplanet",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/animalplanet"
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/d3bf3b059f0117dfe02aadd4befad102/error.txt",
          "slug": "globonews",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/d3bf3b059f0117dfe02aadd4befad102/error.txt",
          "slug": "globonews",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 1 (EmbedCanais)": "https://embedcanaisdetv.xyz/e/index.php?canal=globonews",
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/globonews",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/globonews"
      }
    },
    "BandNews": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/e8f260d07b6320e7fdb2319bde3de2c8/error.txt",
          "slug": "bandnews",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/e8f260d07b6320e7fdb2319bde3de2c8/error.txt",
          "slug": "bandnews",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/bandnews",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/bandnews"
      }
    },
    "Multishow": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/3d266b70a14ae9b1e03ea5b1e70a1670/error.txt",
          "slug": "multishow",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/3d266b70a14ae9b1e03ea5b1e70a1670/error.txt",
          "slug": "multishow",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/multishow",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/multishow"
      }
    },
    "MTV": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/3d251d08a8181fc9fa6ae5c6a01922f2/error.txt",
          "slug": "mtv",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/3d251d08a8181fc9fa6ae5c6a01922f2/error.txt",
          "slug": "mtv",
          "cdn": "CDN 2"
        }
      ],
      "contingency": {
        "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/mtv",
        "Servidor 5 (EmbedTV)": "https://w7.embedtv.cc/mtv"
      }
    }
  },
  "Séries 24h": {
    "Chaves 24h": {
      "status": "ONLINE",
      "sources": [
        {
          "name": "Servidor 1 (Principal)",
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/bfd058527f58d66d04745ee82090970a/error.txt",
          "slug": "24h_chaves",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/bfd058527f58d66d04745ee82090970a/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/de000ffc880a738fbfa0ba8013dcf461/error.txt",
          "slug": "24h_dragonball",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/de000ffc880a738fbfa0ba8013dcf461/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/def0206b4abea94a2bc6cebf0fc00974/error.txt",
          "slug": "24h_naruto",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/def0206b4abea94a2bc6cebf0fc00974/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/db77bb488521614c3e2fdd0951461474/error.txt",
          "slug": "24h_simpsons",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/db77bb488521614c3e2fdd0951461474/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/a608e538c06a477b16c604e3d0a1be06/error.txt",
          "slug": "24h_picapau",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/a608e538c06a477b16c604e3d0a1be06/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/6821200016bc81d99832bc19c74c3556/error.txt",
          "slug": "24h_friends",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/6821200016bc81d99832bc19c74c3556/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/cf62ba78594479962b7a156955d020dc/error.txt",
          "slug": "24h_odeiachris",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/cf62ba78594479962b7a156955d020dc/error.txt",
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
