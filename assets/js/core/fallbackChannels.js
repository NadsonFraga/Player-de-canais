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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/6eadf1273d782b8eceff5138f3026303/error.txt",
          "slug": "globosp",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/6eadf1273d782b8eceff5138f3026303/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/9f2fd328ecb799b24f2e0270d6dafc28/error.txt",
          "slug": "bandsp",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/9f2fd328ecb799b24f2e0270d6dafc28/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/ff68d50ec8eb989cc39b641836760e0f/error.txt",
          "slug": "sbt",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/ff68d50ec8eb989cc39b641836760e0f/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/9163867b217d880008c0f8ed8d18288a/error.txt",
          "slug": "recordsp",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/9163867b217d880008c0f8ed8d18288a/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/a710c20597e364c0b44afdd9a2191709/error.txt",
          "slug": "sportv",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/a710c20597e364c0b44afdd9a2191709/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/b1e8296fd27f9267018720cfc29379c7/error.txt",
          "slug": "sportv2",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/b1e8296fd27f9267018720cfc29379c7/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/4b30ba9bfc53d92d33c1289b53f4aa57/error.txt",
          "slug": "sportv3",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/4b30ba9bfc53d92d33c1289b53f4aa57/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/0c242a36c6ecb262e835c52e9641105d/error.txt",
          "slug": "premiere",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/0c242a36c6ecb262e835c52e9641105d/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/d4b13e9ae17c886313595498ce917599/error.txt",
          "slug": "espn",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/d4b13e9ae17c886313595498ce917599/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/758c3e2c2befced73c9cb4d870d01067/error.txt",
          "slug": "espn2",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/758c3e2c2befced73c9cb4d870d01067/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/61c3030ab47c2768ad6ab4fc21c3bf08/error.txt",
          "slug": "espn3",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/61c3030ab47c2768ad6ab4fc21c3bf08/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/9f101061b74c0b87c58c34aa369d501b/error.txt",
          "slug": "espn4",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/9f101061b74c0b87c58c34aa369d501b/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/585a901fbf43806f258cee7793759659/error.txt",
          "slug": "espn5",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/585a901fbf43806f258cee7793759659/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/86dcb14618671278af8dd8842fb4dc67/error.txt",
          "slug": "bandsports",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/86dcb14618671278af8dd8842fb4dc67/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/6daf38cd092eb057083d7b9aad97813b/error.txt",
          "slug": "combate",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/6daf38cd092eb057083d7b9aad97813b/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/6128d45043f5502600a324b806f20492/error.txt",
          "slug": "ufcfightpass",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/6128d45043f5502600a324b806f20492/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/79826e9eb9c4a3ca0f608fdad8438bb1/error.txt",
          "slug": "xsports",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/79826e9eb9c4a3ca0f608fdad8438bb1/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/9d4d59319b21785836a90e1f04f4cddd/error.txt",
          "slug": "hbo",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/9d4d59319b21785836a90e1f04f4cddd/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/0a303d65ef0fce9cec371893a6b4ddc5/error.txt",
          "slug": "hbo2",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/0a303d65ef0fce9cec371893a6b4ddc5/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/ffbf821376dd36c8bdc0d550cbeb9408/error.txt",
          "slug": "hboplus",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/ffbf821376dd36c8bdc0d550cbeb9408/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/31a377c94fd0ccdad416cf4293bc9bf8/error.txt",
          "slug": "hbofamily",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/31a377c94fd0ccdad416cf4293bc9bf8/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/4631a0ee10b1c532f4ac3798d3b68986/error.txt",
          "slug": "disneyplus1",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/4631a0ee10b1c532f4ac3798d3b68986/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/a4945cc94be2399bcd78af5f5ce09a55/error.txt",
          "slug": "max1",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/a4945cc94be2399bcd78af5f5ce09a55/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/14126598528b9b5dd64accfb965b57fd/error.txt",
          "slug": "primevideo",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/14126598528b9b5dd64accfb965b57fd/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/3039c3a7a3f87b1bfa5506673ad0bf90/error.txt",
          "slug": "cartoonnetwork",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/3039c3a7a3f87b1bfa5506673ad0bf90/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/76a92aaa196b8af25d34138b22840427/error.txt",
          "slug": "cartoonito",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/76a92aaa196b8af25d34138b22840427/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/adea49efd44f20e8f128a88c753b83f2/error.txt",
          "slug": "discoverykids",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/adea49efd44f20e8f128a88c753b83f2/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/3890e5da09db89ee3b423acecad1516e/error.txt",
          "slug": "gloob",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/3890e5da09db89ee3b423acecad1516e/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/a9b35114ff43a8d03874ccf1714f9723/error.txt",
          "slug": "discoverychannel",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/a9b35114ff43a8d03874ccf1714f9723/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/a9aec0827176913cffe694cb934b3d6d/error.txt",
          "slug": "animalplanet",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/a9aec0827176913cffe694cb934b3d6d/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/fde846c19ca5160bd424ebe87a40b429/error.txt",
          "slug": "globonews",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/fde846c19ca5160bd424ebe87a40b429/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/063fa144e49a273408ad9a609e20b4ef/error.txt",
          "slug": "bandnews",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/063fa144e49a273408ad9a609e20b4ef/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/b887b0cfece996535484b1f71b3df4ff/error.txt",
          "slug": "multishow",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/b887b0cfece996535484b1f71b3df4ff/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/cf4f455d0a633cb1bc1b60e5b4d96c55/error.txt",
          "slug": "mtv",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/cf4f455d0a633cb1bc1b60e5b4d96c55/error.txt",
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
