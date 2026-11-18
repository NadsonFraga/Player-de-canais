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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/1d6a10c80401f8d3ddc6cb24d268d8f3/error.txt",
          "slug": "globosp",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/1d6a10c80401f8d3ddc6cb24d268d8f3/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/472a95a71ff1f47824d37815769d68e0/error.txt",
          "slug": "bandsp",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/472a95a71ff1f47824d37815769d68e0/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/daba22595e4ffc35935df72665086951/error.txt",
          "slug": "sbt",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/daba22595e4ffc35935df72665086951/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/cb421db8cdf5248563c3f59b0adac83a/error.txt",
          "slug": "recordsp",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/cb421db8cdf5248563c3f59b0adac83a/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/7208eda34c1aa922e3085987fc484178/error.txt",
          "slug": "sportv",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/7208eda34c1aa922e3085987fc484178/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/7cd1b486f72c0ad37166c208c307f342/error.txt",
          "slug": "sportv2",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/7cd1b486f72c0ad37166c208c307f342/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/364202a448c9e47c760700cc500aae4a/error.txt",
          "slug": "sportv3",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/364202a448c9e47c760700cc500aae4a/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/317d635a3aae83ea5c661f82ea9ba52f/error.txt",
          "slug": "premiere",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/317d635a3aae83ea5c661f82ea9ba52f/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/7ee85a893b911161476a09ec2d006496/error.txt",
          "slug": "premiere2",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/7ee85a893b911161476a09ec2d006496/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/8e4a2190c8a70a60e8d598d8c92c3db0/error.txt",
          "slug": "premiere3",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/8e4a2190c8a70a60e8d598d8c92c3db0/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/3267886008c586a2129583307ab8e908/error.txt",
          "slug": "premiere4",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/3267886008c586a2129583307ab8e908/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/5de003d3f083639d83cb7d8ec1121f8d/error.txt",
          "slug": "premiere5",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/5de003d3f083639d83cb7d8ec1121f8d/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/8678d7f514e2d3dbcd007b878fc036e5/error.txt",
          "slug": "premiere6",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/8678d7f514e2d3dbcd007b878fc036e5/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/4a6bc8ec0a01b94cb7d305d24f6fdf94/error.txt",
          "slug": "premiere7",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/4a6bc8ec0a01b94cb7d305d24f6fdf94/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/cde658aad23248c307b56049edc803c6/error.txt",
          "slug": "espn",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/cde658aad23248c307b56049edc803c6/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/b4d6c01856f236847cf2457c5d28f9ff/error.txt",
          "slug": "espn2",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/b4d6c01856f236847cf2457c5d28f9ff/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/77d05f2ca59a50037fba5e12c08ce1f2/error.txt",
          "slug": "espn3",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/77d05f2ca59a50037fba5e12c08ce1f2/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/021fd97df5c3194715f9d092c46c082c/error.txt",
          "slug": "espn4",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/021fd97df5c3194715f9d092c46c082c/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/80a6f9c30f3c7abb73e4a050ee613b3b/error.txt",
          "slug": "espn5",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/80a6f9c30f3c7abb73e4a050ee613b3b/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/852e994ce1e708f048f9d2c9ccaa3232/error.txt",
          "slug": "bandsports",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/852e994ce1e708f048f9d2c9ccaa3232/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/10b8a1bc6c95ddb21de0dee3347eff66/error.txt",
          "slug": "caze1",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/10b8a1bc6c95ddb21de0dee3347eff66/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/2a7cf1cf1cbe377f9b8712ff0afda1b5/error.txt",
          "slug": "combate",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/2a7cf1cf1cbe377f9b8712ff0afda1b5/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/0ef23c53a9bc5efb1f4572a1b32ebd69/error.txt",
          "slug": "ufcfightpass",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/0ef23c53a9bc5efb1f4572a1b32ebd69/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/63996486841c70c9c8430f0ab30c73d4/error.txt",
          "slug": "xsports",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/63996486841c70c9c8430f0ab30c73d4/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/79b7a69abf7520abdfc5477d75676339/error.txt",
          "slug": "hbo",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/79b7a69abf7520abdfc5477d75676339/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/6667303946aae66629533d62c630750f/error.txt",
          "slug": "hbo2",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/6667303946aae66629533d62c630750f/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/9fe70721f399a2f228f22fb25e55709f/error.txt",
          "slug": "hboplus",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/9fe70721f399a2f228f22fb25e55709f/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/0140696c592b80e8ff94ee1cd31ce1ec/error.txt",
          "slug": "hbofamily",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/0140696c592b80e8ff94ee1cd31ce1ec/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/102e22c784f296b7646f60632fde024e/error.txt",
          "slug": "comedycentral",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/102e22c784f296b7646f60632fde024e/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/e7b462613d46284bfbb39013bb5fec4d/error.txt",
          "slug": "disneyplus1",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/e7b462613d46284bfbb39013bb5fec4d/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/a7e75ef9035d61e9040f87aaa8913488/error.txt",
          "slug": "max1",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/a7e75ef9035d61e9040f87aaa8913488/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/b3332e8f9ac53161d79fd8d9d0a07ede/error.txt",
          "slug": "paramountplus",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/b3332e8f9ac53161d79fd8d9d0a07ede/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/d2179a436dbd51826aace22e177a4219/error.txt",
          "slug": "primevideo",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/d2179a436dbd51826aace22e177a4219/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/9f6731bdf66f8df3077cc2c01d3fe5c2/error.txt",
          "slug": "cartoonnetwork",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/9f6731bdf66f8df3077cc2c01d3fe5c2/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/e8fd1b2cf203eef17c7bcb659154ae52/error.txt",
          "slug": "cartoonito",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/e8fd1b2cf203eef17c7bcb659154ae52/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/79979e87d43f76b51e4f2404ca8d6be2/error.txt",
          "slug": "nickelodeon",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/79979e87d43f76b51e4f2404ca8d6be2/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/5e148fb58617107ad37b3be43006418a/error.txt",
          "slug": "nickjr",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/5e148fb58617107ad37b3be43006418a/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/1c3f7eb5dff59fd4215e89d47ce542cd/error.txt",
          "slug": "discoverykids",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/1c3f7eb5dff59fd4215e89d47ce542cd/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/b8d1b7fd50d6f3df3a173425a6b6f09b/error.txt",
          "slug": "gloob",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/b8d1b7fd50d6f3df3a173425a6b6f09b/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/845903092d53f35d01d4bf9946c268c9/error.txt",
          "slug": "discoverychannel",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/845903092d53f35d01d4bf9946c268c9/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/d8c8deece228cb8f5d0cb7081122cdb4/error.txt",
          "slug": "animalplanet",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/d8c8deece228cb8f5d0cb7081122cdb4/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/3ed3c54276ddf088aca4acda98915e4a/error.txt",
          "slug": "globonews",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/3ed3c54276ddf088aca4acda98915e4a/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/133906894c07218de5f905c90f2f2955/error.txt",
          "slug": "bandnews",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/133906894c07218de5f905c90f2f2955/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/02515c36a6f0957f376a8439c694f7c2/error.txt",
          "slug": "multishow",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/02515c36a6f0957f376a8439c694f7c2/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/b1d7b45466cb6bbd651c776719eff3eb/error.txt",
          "slug": "mtv",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/b1d7b45466cb6bbd651c776719eff3eb/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/0a763ff5d81a8cdca956a0113a1fe882/error.txt",
          "slug": "24h_chaves",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/0a763ff5d81a8cdca956a0113a1fe882/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/47c8f072e3013d1527b7f8059e0bf261/error.txt",
          "slug": "24h_dragonball",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/47c8f072e3013d1527b7f8059e0bf261/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/c126773d1901617267602b9c7cbdbf55/error.txt",
          "slug": "24h_naruto",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/c126773d1901617267602b9c7cbdbf55/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/8116f621c43e499d99e10c7a8891be50/error.txt",
          "slug": "24h_simpsons",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/8116f621c43e499d99e10c7a8891be50/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/a7621b064c17fe68fd97d40123268679/error.txt",
          "slug": "24h_picapau",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/a7621b064c17fe68fd97d40123268679/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/4beea01a8f3397380a48a024b58c6402/error.txt",
          "slug": "24h_friends",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/4beea01a8f3397380a48a024b58c6402/error.txt",
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
          "url": "https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/639909d19f9507fc52234dfbcbd7c416/error.txt",
          "slug": "24h_odeiachris",
          "cdn": "CDN 1"
        },
        {
          "name": "Servidor 2 (Backup)",
          "url": "https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/639909d19f9507fc52234dfbcbd7c416/error.txt",
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
