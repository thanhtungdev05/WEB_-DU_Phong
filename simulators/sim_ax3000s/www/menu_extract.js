// ============================================================================
// File: menu.js
// Mô tả: Cấu trúc menu của giao diện web (Router UI). File này định nghĩa các 
//        đường dẫn, phân cấp menu và quyền truy cập (ACL) cho từng trang.
// Lưu ý: File này được tự động tạo ra từ (firmware menu.d + skr-menu.d).
// ============================================================================
// Auto-generated from firmware menu.d + skr-menu.d
module.exports = {
 "status": {
  "children": {
   "overview": {
    "children": {},
    "title": "Overview",
    "order": 1,
    "action": {
     "type": "template",
     "path": "admin_status/index"
    },
    "depends": {
     "acl": [
      "luci-mod-status-index"
     ]
    }
   },
   "iptables": {
    "children": {},
    "title": "Firewall",
    "order": 2,
    "action": {
     "type": "view",
     "path": "status/iptables"
    },
    "depends": {
     "acl": [
      "luci-mod-status-firewall"
     ]
    }
   },
   "routes": {
    "children": {},
    "title": "Routes",
    "order": 3,
    "action": {
     "type": "view",
     "path": "status/routes"
    },
    "depends": {
     "acl": [
      "luci-mod-status-routes"
     ]
    }
   },
   "syslog": {
    "children": {},
    "title": "System Log",
    "order": 4,
    "action": {
     "type": "view",
     "path": "status/syslog"
    },
    "depends": {
     "acl": [
      "luci-mod-status-logs"
     ]
    }
   },
   "dmesg": {
    "children": {},
    "title": "Kernel Log",
    "order": 5,
    "action": {
     "type": "view",
     "path": "status/dmesg"
    },
    "depends": {
     "acl": [
      "luci-mod-status-logs"
     ]
    }
   },
   "processes": {
    "children": {},
    "title": "Processes",
    "order": 6,
    "action": {
     "type": "view",
     "path": "status/processes"
    },
    "depends": {
     "acl": [
      "luci-mod-status-processes"
     ]
    }
   },
   "channel_analysis": {
    "children": {},
    "title": "Channel Analysis",
    "order": 7,
    "action": {
     "type": "view",
     "path": "status/channel_analysis"
    },
    "depends": {
     "acl": [
      "luci-mod-status-channel_analysis"
     ],
     "uci": {
      "wireless": {
       "@wifi-device": true
      }
     }
    }
   },
   "realtime": {
    "children": {
     "load": {
      "children": {},
      "title": "Load",
      "order": 1,
      "action": {
       "type": "view",
       "path": "status/load"
      }
     },
     "bandwidth": {
      "children": {},
      "title": "Traffic",
      "order": 2,
      "action": {
       "type": "view",
       "path": "status/bandwidth"
      }
     },
     "wireless": {
      "children": {},
      "title": "Wireless",
      "order": 3,
      "action": {
       "type": "view",
       "path": "status/wireless"
      },
      "depends": {
       "uci": {
        "wireless": {
         "@wifi-device": true
        }
       }
      }
     },
     "connections": {
      "children": {},
      "title": "Connections",
      "order": 4,
      "action": {
       "type": "view",
       "path": "status/connections"
      }
     }
    },
    "title": "Realtime Graphs",
    "order": 7,
    "action": {
     "type": "alias",
     "path": "admin/status/realtime/load"
    },
    "depends": {
     "acl": [
      "luci-mod-status-realtime"
     ]
    }
   },
   "devinfo": {
    "children": {},
    "title": "Device lnfo",
    "order": 10,
    "action": {
     "type": "skview",
     "path": "devinfo"
    },
    "depends": {}
   },
   "waninfo": {
    "children": {},
    "title": "waninfo_title",
    "order": 20,
    "action": {
     "type": "skview",
     "path": "waninfo"
    },
    "depends": {}
   },
   "laninfo": {
    "children": {
     "lanEthInfo": {
      "children": {},
      "title": "LAN Ethernet Info",
      "order": 10,
      "action": {
       "type": "skview",
       "path": "lanEthInfo"
      },
      "depends": {}
     },
     "wlanInfo": {
      "children": {},
      "title": "wlanInfo_title",
      "order": 20,
      "action": {
       "type": "skview",
       "path": "wlanInfo"
      },
      "depends": {}
     },
     "lanStaInfo": {
      "children": {},
      "title": "IPv4 Connected Device",
      "order": 25,
      "action": {
       "type": "skview",
       "path": "lanStaInfo"
      },
      "depends": {}
     },
     "lanStaInfov6": {
      "children": {},
      "title": "IPv6 Connected Device",
      "order": 30,
      "action": {
       "type": "skview",
       "path": "lanStaInfov6"
      },
      "depends": {}
     }
    },
    "title": "lanEthInfo_LANInfo",
    "order": 30,
    "action": {
     "type": "firstchild",
     "preferred": "lancfg",
     "recurse": true
    },
    "depends": {}
   },
   "Tr069Sta": {
    "children": {},
    "title": "tr69Sta_title",
    "order": 50,
    "action": {
     "type": "skview",
     "path": "Tr069Sta"
    },
    "depends": {}
   },
   "Guide": {
    "children": {},
    "title": "Download User Guide",
    "order": 55,
    "action": {
     "type": "skview",
     "path": "guidebook"
    },
    "depends": {}
   },
   "wireguard": {
    "children": {},
    "title": "WireGuard",
    "order": 92,
    "action": {
     "type": "template",
     "path": "wireguard"
    },
    "depends": {
     "acl": [
      "luci-mod-status-index"
     ]
    }
   }
  },
  "title": "Status",
  "order": 10,
  "action": {
   "type": "firstchild",
   "preferred": "status",
   "recurse": true
  }
 },
 "wizard": {
  "children": {},
  "title": "Wizard",
  "order": 10,
  "action": {
   "type": "skview",
   "path": "quickset",
   "hidden": 1
  },
  "depends": {}
 },
 "network": {
  "children": {
   "network": {
    "children": {},
    "title": "Interfaces",
    "order": 10,
    "action": {
     "type": "view",
     "path": "network/interfaces"
    },
    "depends": {
     "acl": [
      "luci-mod-network-config"
     ]
    }
   },
   "wancfg": {
    "children": {},
    "title": "wancfg_title",
    "order": 10,
    "action": {
     "type": "skview",
     "path": "wancfg"
    },
    "depends": {}
   },
   "wireless": {
    "children": {},
    "title": "Wireless",
    "order": 15,
    "action": {
     "type": "view",
     "path": "network/wireless"
    },
    "depends": {
     "acl": [
      "luci-mod-network-config"
     ],
     "uci": {
      "wireless": {
       "@wifi-device": true
      }
     }
    }
   },
   "lancfg": {
    "children": {
     "lancfgv4": {
      "children": {},
      "title": "IPv4 Configuration",
      "order": 10,
      "action": {
       "type": "skview",
       "path": "lancfgv4"
      },
      "depends": {}
     },
     "lancfgv6": {
      "children": {},
      "title": "IPv6 Configuration",
      "order": 20,
      "action": {
       "type": "skview",
       "path": "lancfgv6"
      },
      "depends": {}
     }
    },
    "title": "LAN Configuration",
    "order": 20,
    "action": {
     "type": "firstchild",
     "preferred": "lancfg",
     "recurse": true
    }
   },
   "switch": {
    "children": {},
    "title": "Switch",
    "order": 20,
    "action": {
     "type": "view",
     "path": "network/switch"
    },
    "depends": {
     "acl": [
      "luci-mod-network-config"
     ],
     "fs": {
      "/sbin/swconfig": "executable"
     },
     "uci": {
      "network": {
       "@switch": true
      }
     }
    }
   },
   "speedlimitcfg": {
    "children": {},
    "title": "Speed Limit Configuration",
    "order": 25,
    "action": {
     "type": "skview",
     "path": "speedLimitCfg"
    }
   },
   "dhcp": {
    "children": {},
    "title": "DHCP and DNS",
    "order": 30,
    "action": {
     "type": "view",
     "path": "network/dhcp"
    },
    "depends": {
     "acl": [
      "luci-mod-network-dhcp"
     ],
     "fs": {
      "/usr/sbin/dnsmasq": "executable"
     },
     "uci": {
      "dhcp": true
     }
    }
   },
   "staticroute": {
    "children": {},
    "title": "Static Route",
    "order": 30,
    "action": {
     "type": "skview",
     "path": "staticroute"
    }
   },
   "hosts": {
    "children": {},
    "title": "Hostnames",
    "order": 40,
    "action": {
     "type": "view",
     "path": "network/hosts"
    },
    "depends": {
     "acl": [
      "luci-mod-network-dhcp"
     ],
     "uci": {
      "dhcp": true
     }
    }
   },
   "ntp": {
    "children": {},
    "title": "sntpNavText",
    "order": 50,
    "action": {
     "type": "skview",
     "path": "Sntp"
    },
    "depends": {}
   },
   "routes": {
    "children": {},
    "title": "Static Routes",
    "order": 50,
    "action": {
     "type": "view",
     "path": "network/routes"
    },
    "depends": {
     "acl": [
      "luci-mod-network-config"
     ]
    }
   },
   "diagnostics": {
    "children": {},
    "title": "Diagnostics",
    "order": 60,
    "action": {
     "type": "view",
     "path": "network/diagnostics"
    },
    "depends": {
     "acl": [
      "luci-mod-network-diagnostics"
     ]
    }
   },
   "firewall": {
    "children": {
     "zones": {
      "children": {},
      "title": "General Settings",
      "order": 10,
      "action": {
       "type": "view",
       "path": "firewall/zones"
      }
     },
     "forwards": {
      "children": {},
      "title": "Port Forwards",
      "order": 20,
      "action": {
       "type": "view",
       "path": "firewall/forwards"
      }
     },
     "rules": {
      "children": {},
      "title": "Traffic Rules",
      "order": 30,
      "action": {
       "type": "view",
       "path": "firewall/rules"
      }
     },
     "snats": {
      "children": {},
      "title": "NAT Rules",
      "order": 40,
      "action": {
       "type": "view",
       "path": "firewall/snats"
      }
     },
     "custom": {
      "children": {},
      "title": "Custom Rules",
      "order": 50,
      "action": {
       "type": "view",
       "path": "firewall/custom"
      }
     }
    },
    "title": "Firewall",
    "order": 60,
    "action": {
     "type": "alias",
     "path": "admin/network/firewall/zones"
    },
    "depends": {
     "acl": [
      "luci-app-firewall"
     ],
     "fs": {
      "/sbin/fw3": "executable"
     },
     "uci": {
      "firewall": true
     }
    }
   },
   "qos": {
    "children": {
     "qosclass": {
      "children": {},
      "title": "QoSClass",
      "order": 20,
      "action": {
       "type": "skview",
       "path": "qosclass"
      },
      "depends": {}
     }
    },
    "title": "QoS",
    "order": 60,
    "action": {
     "type": "skview",
     "path": "qos"
    },
    "depends": {}
   }
  },
  "title": "network_title",
  "order": 20,
  "action": {
   "type": "firstchild",
   "preferred": "network",
   "recurse": true
  }
 },
 "wlan": {
  "children": {
   "wlangband": {
    "children": {
     "wlanBasicSetting2g": {
      "children": {},
      "title": "wlanBasicSetting2g_title",
      "order": 10,
      "action": {
       "type": "skview",
       "path": "wlanBasicSetting2g"
      },
      "depends": {}
     },
     "wlanWpsConfig2g": {
      "children": {},
      "title": "wlanWpsConfig2g_title",
      "order": 30,
      "action": {
       "type": "skview",
       "path": "wlanWpsConfig2g"
      },
      "depends": {}
     },
     "wlanNeighborAp2g": {
      "children": {},
      "title": "wlanNeighborAp2g_title",
      "order": 40,
      "action": {
       "type": "skview",
       "path": "wlanNeighborAp2g"
      },
      "depends": {}
     }
    },
    "title": "skgWlanGband_title",
    "order": 10,
    "action": {
     "type": "firstchild",
     "preferred": "wlangband",
     "recurse": true
    },
    "depends": {}
   },
   "wlanaband": {
    "children": {
     "wlanBasicSetting5g": {
      "children": {},
      "title": "wlanBasicSetting5g_title",
      "order": 10,
      "action": {
       "type": "skview",
       "path": "wlanBasicSetting5g"
      },
      "depends": {}
     },
     "wlanWpsConfig5g": {
      "children": {},
      "title": "wlanWpsConfig5g_title",
      "order": 30,
      "action": {
       "type": "skview",
       "path": "wlanWpsConfig5g"
      },
      "depends": {}
     },
     "wlanNeighborAp5g": {
      "children": {},
      "title": "wlanNeighborAp5g_title",
      "order": 40,
      "action": {
       "type": "skview",
       "path": "wlanNeighborAp5g"
      },
      "depends": {}
     }
    },
    "title": "skgWlanAband_title",
    "order": 20,
    "action": {
     "type": "firstchild",
     "preferred": "wlanaband",
     "recurse": true
    },
    "depends": {}
   },
   "advance": {
    "children": {
     "scheduler": {
      "children": {},
      "title": "Scheduler",
      "order": 20,
      "action": {
       "type": "skview",
       "path": "scheduler"
      },
      "depends": {}
     },
     "wlanAccessControl": {
      "children": {},
      "title": "wlanAccessControl_title",
      "order": 40,
      "action": {
       "type": "skview",
       "path": "wlanAccessControl"
      },
      "depends": {}
     },
     "wlanBandsteering": {
      "children": {},
      "title": "skgWlanBandsteering_title",
      "order": 50,
      "action": {
       "type": "skview",
       "path": "wlanBandsteering"
      },
      "depends": {}
     },
     "wlanMapSettingAll": {
      "children": {},
      "title": "Multiple SSID",
      "order": 60,
      "action": {
       "type": "skview",
       "path": "wlanMapSettingAll"
      },
      "depends": {}
     }
    },
    "title": "Advance",
    "order": 40,
    "action": {
     "type": "firstchild",
     "preferred": "advance",
     "recurse": true
    }
   },
   "wlanmesh": {
    "children": {},
    "title": "Mesh",
    "order": 40,
    "action": {
     "type": "skview",
     "path": "wlanMesh"
    },
    "depends": {}
   }
  },
  "title": "WLAN",
  "order": 30,
  "action": {
   "type": "firstchild",
   "preferred": "wlan",
   "recurse": true
  }
 },
 "services": {
  "children": {
   "ddns": {
    "children": {},
    "title": "Dynamic DNS",
    "order": 59,
    "action": {
     "type": "view",
     "path": "ddns/overview"
    },
    "depends": {
     "acl": [
      "luci-app-ddns"
     ]
    }
   },
   "management": {
    "children": {
     "tr-069": {
      "children": {},
      "title": "TR-069",
      "order": 1,
      "action": {
       "type": "cbi",
       "path": "easycwmp",
       "post": {
        "cbi.submit": true
       }
      },
      "depends": {
       "acl": [
        "luci-app-easycwmp"
       ]
      }
     },
     "datamodel": {
      "children": {},
      "title": "Datamodel",
      "order": 3,
      "action": {
       "type": "view",
       "path": "datamodel/dmc"
      },
      "depends": {
       "acl": [
        "luci-app-dmc"
       ],
       "fs": {
        "/usr/sbin/datamodel": "executable"
       }
      }
     },
     "tr069_upnp": {
      "children": {},
      "title": "TR069-UPNP",
      "order": 20,
      "action": {
       "type": "cbi",
       "path": "tr069_upnp",
       "post": {
        "cbi.submit": true
       }
      },
      "depends": {
       "acl": [
        "luci-app-tr069_upnp"
       ]
      }
     },
     "bulkdata": {
      "children": {},
      "title": "BULKDATA",
      "order": 30,
      "action": {
       "type": "cbi",
       "path": "bulkdata",
       "post": {
        "cbi.submit": true
       }
      },
      "depends": {
       "acl": [
        "luci-app-bulkdata"
       ]
      }
     },
     "obuspa": {
      "children": {},
      "title": "OBUSPA",
      "order": 50,
      "action": {
       "type": "cbi",
       "path": "obuspa",
       "post": {
        "cbi.submit": true
       }
      },
      "depends": {
       "acl": [
        "luci-app-obuspa"
       ]
      }
     },
     "easystatus": {
      "children": {},
      "title": "TR069-Status",
      "order": 70,
      "action": {
       "type": "view",
       "path": "easycwmp/easystatus"
      },
      "depends": {
       "acl": [
        "luci-app-easystatus"
       ],
       "fs": {
        "/bin/ubus": "executable"
       }
      }
     },
     "easylog": {
      "children": {},
      "title": "LOG",
      "order": 75,
      "action": {
       "type": "view",
       "path": "easycwmp/easylog"
      },
      "depends": {
       "acl": [
        "luci-app-easylog"
       ]
      }
     }
    },
    "title": "Management",
    "order": 60,
    "action": {
     "type": "alias",
     "path": "admin/services/management/tr-069"
    },
    "depends": {
     "acl": [
      "luci-app-easycwmp"
     ]
    }
   },
   "minidlna": {
    "children": {},
    "title": "miniDLNA",
    "order": 999,
    "action": {
     "type": "view",
     "path": "minidlna"
    },
    "depends": {
     "acl": [
      "luci-app-minidlna"
     ],
     "uci": {
      "minidlna": true
     }
    }
   },
   "omcproxy": {
    "children": {},
    "title": "omcproxy",
    "order": 999,
    "action": {
     "type": "view",
     "path": "omcproxy"
    },
    "depends": {
     "uci": {
      "omcproxy": true
     }
    }
   },
   "upnp": {
    "children": {},
    "title": "UPnP",
    "order": 999,
    "action": {
     "type": "view",
     "path": "upnp/upnp"
    },
    "depends": {
     "acl": [
      "luci-app-ddns"
     ],
     "uci": {
      "upnpd": true
     }
    }
   }
  },
  "title": "Services",
  "order": 40,
  "action": {
   "type": "firstchild",
   "recurse": true
  }
 },
 "security": {
  "children": {
   "firewall": {
    "children": {
     "fwlevel": {
      "children": {},
      "title": "Firewall Level",
      "order": 10,
      "action": {
       "type": "skview",
       "path": "fwlevel",
       "apply": false
      },
      "depends": {}
     },
     "antidos": {
      "children": {},
      "title": "Dos Settings",
      "order": 20,
      "action": {
       "type": "skview",
       "path": "antidos",
       "apply": false
      },
      "depends": {}
     }
    },
    "title": "Firewall",
    "order": 10,
    "action": {
     "type": "firstchild",
     "preferred": "parentalcontrol",
     "recurse": true
    },
    "depends": {}
   },
   "parentalcontrol": {
    "children": {
     "macfilter": {
      "children": {},
      "title": "MAC Filter",
      "order": 20,
      "action": {
       "type": "skview",
       "path": "macfilter",
       "apply": false
      },
      "depends": {}
     },
     "urlfilter": {
      "children": {},
      "title": "URL Filter",
      "order": 30,
      "action": {
       "type": "skview",
       "path": "urlfilter",
       "apply": false
      },
      "depends": {}
     },
     "ipfilter": {
      "children": {},
      "title": "IP Filter",
      "order": 40,
      "action": {
       "type": "skview",
       "path": "ipfilter",
       "apply": false
      },
      "depends": {}
     }
    },
    "title": "Parental Control",
    "order": 20,
    "action": {
     "type": "firstchild",
     "preferred": "parentalcontrol",
     "recurse": true
    },
    "depends": {}
   },
   "acl": {
    "children": {},
    "title": "ACL",
    "order": 40,
    "action": {
     "type": "skview",
     "path": "acl"
    },
    "depends": {}
   }
  },
  "title": "Security",
  "order": 50,
  "action": {
   "type": "firstchild",
   "preferred": "security",
   "recurse": true
  }
 },
 "system": {
  "children": {
   "system": {
    "children": {},
    "title": "System",
    "order": 1,
    "action": {
     "type": "view",
     "path": "system/system"
    },
    "depends": {
     "acl": [
      "luci-mod-system-config"
     ]
    }
   },
   "admin": {
    "children": {
     "password": {
      "children": {},
      "title": "Router Password",
      "order": 1,
      "action": {
       "type": "view",
       "path": "system/password"
      },
      "depends": {
       "acl": [
        "luci-mod-system-config"
       ]
      }
     },
     "dropbear": {
      "children": {},
      "title": "SSH Access",
      "order": 2,
      "action": {
       "type": "view",
       "path": "system/dropbear"
      },
      "depends": {
       "acl": [
        "luci-mod-system-ssh"
       ],
       "fs": {
        "/usr/sbin/dropbear": "executable"
       }
      }
     },
     "sshkeys": {
      "children": {},
      "title": "SSH-Keys",
      "order": 3,
      "action": {
       "type": "view",
       "path": "system/sshkeys"
      },
      "depends": {
       "acl": [
        "luci-mod-system-ssh"
       ],
       "fs": {
        "/usr/sbin/dropbear": "executable"
       }
      }
     }
    },
    "title": "User Management",
    "order": 10,
    "action": {
     "type": "skview",
     "path": "useradmin"
    },
    "depends": {}
   },
   "Diagnostic": {
    "children": {
     "Tr069Inform": {
      "children": {},
      "title": "tr69inform_title",
      "order": 20,
      "action": {
       "type": "skview",
       "path": "Tr069Inform"
      },
      "depends": {}
     },
     "DnsLookup": {
      "children": {},
      "title": "DNS Lookup",
      "order": 25,
      "action": {
       "type": "skview",
       "path": "DnsLookup"
      },
      "depends": {}
     },
     "pingtest": {
      "children": {},
      "title": "Ping Test",
      "order": 30,
      "action": {
       "type": "skview",
       "path": "pingtest"
      },
      "depends": {}
     },
     "traceroutetest": {
      "children": {},
      "title": "Traceroute Test",
      "order": 40,
      "action": {
       "type": "skview",
       "path": "traceroutetest"
      },
      "depends": {}
     },
     "speedtest": {
      "children": {},
      "title": "Speed Test",
      "order": 50,
      "action": {
       "type": "skview",
       "path": "speedtest"
      },
      "depends": {}
     },
     "pktcapture": {
      "children": {},
      "title": "Packet Capture",
      "order": 60,
      "action": {
       "type": "skview",
       "path": "pktcapture"
      },
      "depends": {}
     },
     "pktmirror": {
      "children": {},
      "title": "Packet Mirror",
      "order": 60,
      "action": {
       "type": "skview",
       "path": "pktmirror"
      },
      "depends": {}
     },
     "skDiagLog": {
      "children": {},
      "title": "Diag Log",
      "order": 70,
      "action": {
       "type": "skview",
       "path": "skDiagLog"
      },
      "depends": {}
     }
    },
    "title": "Diagnostic",
    "order": 30,
    "action": {
     "type": "firstchild",
     "preferred": "Diagnostic",
     "recurse": true
    }
   },
   "opkg": {
    "children": {},
    "title": "Software",
    "order": 30,
    "action": {
     "type": "view",
     "path": "opkg"
    },
    "depends": {
     "acl": [
      "luci-app-opkg"
     ]
    }
   },
   "reboot": {
    "children": {},
    "title": "rebootText",
    "order": 30,
    "action": {
     "type": "skview",
     "path": "skgReboot"
    },
    "depends": {}
   },
   "restore": {
    "children": {},
    "title": "Backup & Restore",
    "order": 40,
    "action": {
     "type": "skview",
     "path": "skgRestore"
    },
    "depends": {}
   },
   "startup": {
    "children": {},
    "title": "Startup",
    "order": 45,
    "action": {
     "type": "view",
     "path": "system/startup"
    },
    "depends": {
     "acl": [
      "luci-mod-system-init"
     ]
    }
   },
   "crontab": {
    "children": {},
    "title": "Scheduled Tasks",
    "order": 46,
    "action": {
     "type": "view",
     "path": "system/crontab"
    },
    "depends": {
     "acl": [
      "luci-mod-system-cron"
     ]
    }
   },
   "mounts": {
    "children": {},
    "title": "Mount Points",
    "order": 50,
    "action": {
     "type": "view",
     "path": "system/mounts"
    },
    "depends": {
     "acl": [
      "luci-mod-system-mounts"
     ],
     "fs": {
      "/sbin/block": "executable"
     }
    }
   },
   "upgrade": {
    "children": {},
    "title": "upgradeNavTitleText",
    "order": 50,
    "action": {
     "type": "skview",
     "path": "skgupgrade"
    },
    "depends": {}
   },
   "leds": {
    "children": {},
    "title": "LED Configuration",
    "order": 60,
    "action": {
     "type": "view",
     "path": "system/leds"
    },
    "depends": {
     "acl": [
      "luci-mod-system-config"
     ],
     "fs": {
      "/sys/class/leds": "directory"
     }
    }
   },
   "syslog": {
    "children": {},
    "title": "System Log",
    "order": 60,
    "action": {
     "type": "skview",
     "path": "skgsyslog"
    },
    "depends": {}
   },
   "flash": {
    "children": {},
    "title": "Backup / Flash Firmware",
    "order": 70,
    "action": {
     "type": "view",
     "path": "system/flash"
    },
    "depends": {
     "acl": [
      "luci-mod-system-flash"
     ]
    }
   },
   "led": {
    "children": {},
    "title": "ledCtrlNavText",
    "order": 70,
    "action": {
     "type": "skview",
     "path": "skgLedCtrl",
     "hidden": 1
    },
    "depends": {}
   }
  },
  "title": "System Tools",
  "order": 70,
  "action": {
   "type": "firstchild",
   "preferred": "system",
   "recurse": true
  }
 },
 "vpn": {
  "children": {},
  "title": "VPN",
  "order": 70,
  "action": {
   "type": "firstchild",
   "recurse": true
  }
 },
 "advanced": {
  "children": {
   "nat": {
    "children": {
     "dmz": {
      "children": {},
      "title": "DMZ",
      "order": 10,
      "action": {
       "type": "skview",
       "path": "dmz"
      },
      "depends": {}
     },
     "alg": {
      "children": {},
      "title": "ALG",
      "order": 20,
      "action": {
       "type": "skview",
       "path": "alg"
      },
      "depends": {}
     },
     "fullconenat": {
      "children": {},
      "title": "FULLCONENAT",
      "order": 25,
      "action": {
       "type": "skview",
       "path": "fullconenat"
      },
      "depends": {}
     },
     "portforward": {
      "children": {},
      "title": "Port Forwarding",
      "order": 30,
      "action": {
       "type": "skview",
       "path": "portforward"
      },
      "depends": {}
     }
    },
    "title": "NAT",
    "order": 30,
    "action": {
     "type": "firstchild",
     "preferred": "nat",
     "recurse": true
    }
   },
   "iptv": {
    "children": {
     "igmpproxy": {
      "children": {},
      "title": "Proxy",
      "order": 10,
      "action": {
       "type": "skview",
       "path": "igmpproxy"
      },
      "depends": {}
     },
     "igmpsnooping": {
      "children": {},
      "title": "Snooping",
      "order": 20,
      "action": {
       "type": "skview",
       "path": "igmpsnooping"
      },
      "depends": {}
     }
    },
    "title": "IPTV Configuration",
    "order": 40,
    "action": {
     "type": "firstchild",
     "preferred": "iptv",
     "recurse": true
    }
   },
   "upnp": {
    "children": {},
    "title": "UPnP",
    "order": 40,
    "action": {
     "type": "skview",
     "path": "upnp"
    },
    "depends": {}
   },
   "HiddenPage": {
    "children": {},
    "title": "HiddenPage",
    "order": 50,
    "action": {
     "type": "skview",
     "path": "HiddenPage",
     "hidden": 1
    },
    "depends": {}
   },
   "ddns": {
    "children": {},
    "title": "DDNS",
    "order": 50,
    "action": {
     "type": "skview",
     "path": "ddns"
    },
    "depends": {}
   },
   "vpn": {
    "children": {},
    "title": "VPN",
    "order": 70,
    "action": {
     "type": "skview",
     "path": "vpn"
    },
    "depends": {}
   }
  },
  "title": "Advanced",
  "order": 80,
  "action": {
   "type": "firstchild",
   "preferred": "advanced",
   "recurse": true
  }
 },
 "acscfg": {
  "children": {},
  "title": "ACS_Config_title",
  "order": 150,
  "action": {
   "type": "skview",
   "path": "acscfg",
   "hidden": 1
  },
  "depends": {}
 },
 "check_version": {
  "children": {},
  "title": "",
  "order": 999,
  "action": {
   "type": "template",
   "path": "skgCheckVersion/check_version",
   "hidden": 1
  },
  "depends": {}
 },
 "error_notice": {
  "children": {},
  "title": "",
  "order": 999,
  "action": {
   "type": "template",
   "path": "skErrorNotice/error_notice"
  }
 },
 "logout": {
  "children": {},
  "title": "Logout",
  "order": 999,
  "action": {
   "type": "call",
   "module": "luci.controller.admin.index",
   "function": "action_logout"
  },
  "depends": {
   "acl": [
    "luci-base"
   ]
  }
 },
 "menu": {
  "children": {},
  "title": "",
  "order": 999,
  "action": {
   "type": "call",
   "module": "luci.controller.admin.index",
   "function": "action_menu_new"
  }
 },
 "menunew": {
  "children": {},
  "title": "",
  "order": 999,
  "action": {
   "type": "call",
   "module": "luci.controller.admin.index",
   "function": "action_menu_new"
  }
 },
 "portal": {
  "children": {},
  "title": "",
  "order": 999,
  "action": {
   "type": "template",
   "path": "skgFptAlarm/portal",
   "hidden": 1
  }
 },
 "renew": {
  "children": {},
  "title": "",
  "order": 999,
  "action": {
   "type": "call",
   "module": "luci.controller.admin.index",
   "function": "action_renew"
  }
 },
 "uci": {
  "children": {
   "apply_rollback": {
    "children": {},
    "title": "",
    "order": 999,
    "action": {
     "type": "call",
     "module": "luci.controller.admin.uci",
     "function": "action_apply_rollback",
     "post": true
    }
   },
   "apply_unchecked": {
    "children": {},
    "title": "",
    "order": 999,
    "action": {
     "type": "call",
     "module": "luci.controller.admin.uci",
     "function": "action_apply_unchecked",
     "post": true
    }
   },
   "confirm": {
    "children": {},
    "title": "",
    "order": 999,
    "action": {
     "type": "call",
     "module": "luci.controller.admin.uci",
     "function": "action_confirm"
    }
   },
   "revert": {
    "children": {},
    "title": "",
    "order": 999,
    "action": {
     "type": "call",
     "module": "luci.controller.admin.uci",
     "function": "action_revert",
     "post": true
    }
   }
  },
  "title": "",
  "order": 999,
  "action": {
   "type": "firstchild"
  }
 }
};
var envcar = {"sessionid": "00000000000000000000000000000000", "sessiontime": "600", "resource": "luci-static/resources", "loginuser": "admin", "userlevel": 0};
