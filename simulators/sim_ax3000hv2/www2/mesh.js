var treeJson = {};
let treeDepth = 0;
/*topo_json为获取的拓扑数据*/
/*var topo_json = [{
		"Role": "01",
		"Distance":     "0",
		"Mac":  "aa:bb:20:22:09:20",
		"IP":   "192.168.1.1",
		"UplinkMac":    "",
		"BhType":       "",
		"StaInfo":      [{
						"devname":      "E0-BE-03-32-07-50",
						"mac":  "e0:be:03:32:07:50",
						"ip":   "192.168.1.7",
						"medium":       "eth",
						"rssi": 0
				}]
	}, {
		"Role": "02",
		"Distance":     "1",
		"Mac":  "b8:4d:ee:00:00:b0",
		"IP":   "192.168.1.3",
		"UplinkMac":    "aa:bb:20:22:09:20",
		"BhType":       "Ethernet",
		"StaInfo":      [{
						"devname":      "E0-BE-03-32-07-56",
						"mac":  "e0:be:03:32:07:56",
						"ip":   "192.168.1.8",
						"medium":       "eth",
						"rssi": 0
				},{
						"devname":      "E0-BE-03-32-07-58",
						"mac":  "e0:be:03:32:07:58",
						"ip":   "192.168.1.88",
						"medium":       "eth",
						"rssi": 0
				}]
	}, {
		"Role": "02",
		"Distance":     "2",
		"Mac":  "b8:4d:20:22:09:15",
		"IP":   "192.168.1.2",
		"UplinkMac":    "b8:4d:ee:00:00:b0",
		"BhType":       "",
		"StaInfo":      []
	}, {
		"Role": "02",
		"Distance":     "1",
		"Mac":  "b8:4d:ee:00:00:b2",
		"IP":   "192.168.1.4",
		"UplinkMac":    "aa:bb:20:22:09:20",
		"BhType":       "Ethernet",
		"StaInfo":      []
	}, {
		"Role": "02",
		"Distance":     "1",
		"Mac":  "b8:4d:ee:00:00:b3",
		"IP":   "192.168.1.33",
		"UplinkMac":    "aa:bb:20:22:09:20",
		"BhType":       "Ethernet",
		"StaInfo":      []
	}];*/

document.addEventListener("DOMContentLoaded", function() {
	/*调试数据*/
	treeJson = {
		name: "Root",
		Mac: "00:00:00:00:00:01",
		IP: "192.168.0.1",
		deviceCount: 3,
		StaInfo: [],
		children: [{
				name: "Node 1",
				Mac: "00:00:00:00:00:02",
				IP: "192.168.0.2",
				deviceCount: 2,
				connectionType: "Wired Networking",
				BhType:"Ethernet",
				StaInfo: [],
				children: [{
						name: "Node 1.1",
						Mac: "00:00:00:00:00:03",
						IP: "192.168.0.3",
						deviceCount: 5,
						connectionType: "2.4G WLAN Networking",
						BhType:"2.4G",
						StaInfo: [],
					},
					{
						name: "Node 1.2",
						Mac: "00:00:00:00:00:04",
						IP: "192.168.0.4",
						deviceCount: 1,
						connectionType: "Wired Networking",
						BhType:"Ethernet",
						StaInfo: [],
					},
					{
						name: "Node 1.2",
						Mac: "00:00:00:00:00:05",
						IP: "192.168.0.5",
						deviceCount: 1,
						connectionType: "Wired Networking",
						BhType:"Ethernet",
						StaInfo: [],
					}
				]
			},
			{
				name: "Node 2",
				Mac: "00:00:00:00:00:06",
				IP: "192.168.0.6",
				deviceCount: 4,
				connectionType: "Wired Networking",
				StaInfo: [],
			}
		]
	};
	/*清空调试数据*/
	treeJson= {};
	/*真实数据排序成树状数据，topo_json为获取的拓扑数据*/
	treeJson = convertToTree(topo_json);
	/*参照调试数据，实际数据为第一条数装数据*/
	treeJson = treeJson[0];
	/*const treeData1 = convertToTree1(jsonData);
	console.log(treeData1);*/
	treeDepth = getTreeDepth(treeJson);

});

/*--------------------------*/
/*js把json数据转化成树形数据 */
/*function convertToTree1(data) {
  const tree = [];
 
  for (let i = 0; i < data.length; i++) {
    const node = data[i];
    const parentId = node.parentId;
 
    if (parentId === null || parentId === undefined) {
      tree.push(node);
      continue;
    }
 
    for (let j = 0; j < data.length; j++) {
      const parentNode = data[j];
 
      if (parentNode.id === parentId) {
        if (!parentNode.children) {
          parentNode.children = [];
        }
 
        parentNode.children.push(node);
        break;
      }
    }
  }
 
  return tree;
}
 
// 示例数据
const jsonData = [
  { id: 1, name: 'Node 1', parentId: null },
  { id: 2, name: 'Node 2', parentId: 1 },
  { id: 3, name: 'Node 3', parentId: 1 },
  { id: 4, name: 'Node 4', parentId: 2 },
  { id: 5, name: 'Node 5', parentId: 2 },
  { id: 6, name: 'Node 6', parentId: 3 },
];*/
/*--------------------------*/

/*js把json数据转化成树形数据 */
function convertToTree(data) {
	const tree = [];

	for (let i = 0; i < data.length; i++) {
		const node = data[i];
		node.index = i;
		const UplinkMac = node.UplinkMac;

		if (UplinkMac === null || UplinkMac === undefined || UplinkMac === "") {
			tree.push(node);
			continue;
		}

		for (let j = 0; j < data.length; j++) {
			const parentNode = data[j];

			if (parentNode.Mac === UplinkMac) {
				if (!parentNode.children) {
					parentNode.children = [];
				}

				parentNode.children.push(node);
				break;
			}
		}
	}

	return tree;
}

// 递归函数计算树的最大深度
function getTreeDepth(tree) {
	if (tree === null || typeof tree !== 'object') return -1; // 如果为空或不是对象则返回-1表示无效输入

	var maxDepth = 0;

	function traverse(node, depth) {
		if (!node) return;

		maxDepth = Math.max(depth, maxDepth);
		if (node.children) {
			for (var i = 0; i < node.children.length; ++i) {
				traverse(node.children[i], depth + 1);
			}
		}
	}

	traverse(tree, 0);

	return maxDepth;
}

function init() {
	document.getElementById("div_MeshTopList").style.display="block";
	if(typeof getdata !== "undefined" && String(getdata.mapEnable) === "0")
	{
		document.getElementById("mesh_disable_tip_div").style.display="";
		document.getElementById("topo_table_id").style.display="none";
		document.getElementById("topo_tree_tip_div").style.display="none";
		document.getElementById("topo_tree_div").style.display="none";
		return;
	}
	else
	{
		document.getElementById("mesh_disable_tip_div").style.display="none";
	}
	if(treeDepth >= 3)
	{
		document.getElementById("topo_tree_tip_div").style.display="none";
		document.getElementById("topo_tree_div").style.display="none";
		//document.getElementById("topo_table_tip_id").style.display="";
		document.getElementById("topo_table_id").style.display="";
	} else {
	document.getElementById("topo_tree_tip_div").style.display="";
	document.getElementById("topo_tree_div").style.display="";
	document.getElementById("topo_table_id").style.display="none";
	var width = 680;
	var height = 380;
	if(treeDepth != 2 ) {
		width = 560;
		height = 220;
	}
	var svg = d3.select("#topo_tree_div").append("svg")
		.attr("width", width)
		.attr("height", height);
	var treemap = d3.tree().size([width - 120, height - 30]);
	var nodes = d3.hierarchy(treeJson);
	nodes = treemap(nodes);

	var g = svg.append("g")
		.attr("transform", function(){/*拓扑图整体偏移,正表示右,上*/
			if(treeDepth != 2)
				return "translate(30,12)";
			else
				return "translate(40,12)";
		});

	// 创建连接线
	g.selectAll(".link")
		.data(nodes.descendants().slice(1))
		.enter().append("path")
		.attr("class", "link")
		.attr("d", function(d) {
			var midY = d.y + (d.parent.y - d.y) * 0.45;
			if(d.depth === 2) {
				return "M" + d.x + "," + (d.y-63) +
				"V" + (midY-60) + "H" + d.parent.x +
				"V" + d.parent.y;/* 第一个**V-连接线长度;**H连接线拐弯点y值*/
			} else {
				return "M" + d.x + "," + d.y +
				"V" + midY + "H" + d.parent.x +
				"V" + d.parent.y;
			}
		})
		.style("stroke-dasharray", function(d){
			return (d.data.BhType === "2.4G" || d.data.BhType === "5G" || d.data.BhType === "Ethernet")?"none":"5,2";
		});

	// 添加连接图片
	g.selectAll(".connectionType")
		.data(nodes.descendants().slice(1))
		.enter().append("image")
		.attr("xlink:href", function(d) {
			if (d.data.BhType === "Ethernet") {
				d.data.connectionType = "Wired Networking";
				d.data.RSSI = "N/A";
				if (!d.data.BhPhyRate) d.data.BhPhyRate = "N/A";
			} else if(d.data.BhType === "5G"){
				d.data.connectionType = "5G WLAN Networking";
			} else if(d.data.BhType === "2.4G") {
				d.data.connectionType = "2.4G WLAN Networking";
			}
			if (d.data.connectionType === "2.4G WLAN Networking" || d.data.connectionType === "5G WLAN Networking") {
				return "../conn.png";
			} else if (d.data.connectionType === "Wired Networking") {
				return "../conn-2.png";
			} else {
				return "../conn-2.png";
			}
		})
		.attr("x", function(d) {
			return (d.x - 15);
		})
		.attr("y", function(d) {/*连接图片竖向位置*/
			var midY = 0;
			if(d.parent.children != undefined && d.parent.children.length == 1) {/*其下只有一个子路由时*/
				if(d.depth === 2) {
					midY = d.y + (d.parent.y - d.y) * 0.6 - 30;
				} else {
					midY = d.y + (d.parent.y - d.y) * 0.52;
				}
			} else {
				if(d.depth === 2) {
					midY = d.y + (d.parent.y - d.y) * 0.32 - 60;
				} else {
					midY = d.y + (d.parent.y - d.y) * 0.4;
				}
			}
			return midY - 15;
		})
		.attr("width", 30)
		.attr("height", 30)
		.on("mouseover", function(d) {
			tooltip.transition()
				.duration(200)
				.style("opacity", .95);
			var tooltipContent = "" + d.data.connectionType + "<br/>RSSI: " + d.data.RSSI + "<br/>Backhaul PhyRate: " + d.data.BhPhyRate;
			if (d.data.connectionType === "2.4G WLAN Networking" || d.data.connectionType === "5G WLAN Networking") {
				tooltipContent += "<br/>Assoc Time: " + (d.data.assocTime || "00:00:00");
			}
			tooltip.html(tooltipContent)
				.style("background-color", "#18cd6c")
				.style("left", (d3.event.pageX + 10) + "px")
				.style("top", (d3.event.pageY - 28) + "px");
		})
		.on("mouseout", function(d) {
			tooltip.transition()
				.duration(500)
				.style("opacity", 0);
		});

	// Always-visible green link callout box matching real AX3000HI/AX3000HV2 Mesh Topology screen
	var linkBadges = g.selectAll(".mesh-link-badge")
		.data(nodes.descendants().slice(1))
		.enter().append("g")
		.attr("class", "mesh-link-badge")
		.attr("transform", function(d) {
			var midY = (d.parent.children && d.parent.children.length === 1)
				? (d.depth === 2 ? d.y + (d.parent.y - d.y) * 0.6 - 30 : d.y + (d.parent.y - d.y) * 0.52)
				: (d.depth === 2 ? d.y + (d.parent.y - d.y) * 0.32 - 60 : d.y + (d.parent.y - d.y) * 0.4);
			var isWifi = (d.data.BhType === "5G" || d.data.BhType === "2.4G");
			var boxH = isWifi ? 68 : 54;
			return "translate(" + (d.x + 18) + "," + (midY - boxH / 2) + ")";
		});

	linkBadges.append("rect")
		.attr("rx", 8)
		.attr("ry", 8)
		.attr("width", function(d) {
			return (d.data.BhType === "5G" || d.data.BhType === "2.4G") ? 172 : 158;
		})
		.attr("height", function(d) {
			return (d.data.BhType === "5G" || d.data.BhType === "2.4G") ? 68 : 54;
		})
		.style("fill", "#18cd6c")
		.style("opacity", 0.96);

	linkBadges.each(function(d) {
		var el = d3.select(this);
		var isWifi = (d.data.BhType === "5G" || d.data.BhType === "2.4G");
		var lines = [
			d.data.connectionType || (isWifi ? "5G WLAN Networking" : "Wired Networking"),
			"RSSI: " + (d.data.RSSI || "N/A"),
			"Backhaul PhyRate: " + (d.data.BhPhyRate || "N/A")
		];
		if (isWifi) {
			lines.push("Assoc Time: " + (d.data.assocTime || "00:00:00"));
		}
		lines.forEach(function(line, idx) {
			el.append("text")
				.attr("x", 10)
				.attr("y", 16 + idx * 15)
				.style("fill", "#ffffff")
				.style("font", "11.5px sans-serif")
				.style("font-weight", idx === 0 ? "600" : "400")
				.text(line);
		});
	});

	// 创建 Tooltip
	var tooltip = d3.select("body").append("div")
		.attr("class", "tooltip")
		.style("opacity", 0);

	// 创建节点
	var node = g.selectAll(".node")
		.data(nodes.descendants())
		.enter().append("g")
		.attr("class", "node")
		.attr("transform", function(d) {
			return "translate(" + d.x + "," + d.y + ")";
		})
		.on("mouseover", function(d) {
			tooltip.transition()
				.duration(200)
				.style("opacity", .95);
			d.data.deviceCount = (d.data.StaInfo || []).length;
			tooltip.html(d.data.HostName + "<br/>MAC: " + d.data.Mac + "<br/>IP: " + d.data.IP + "<br/>" + getdata.MeshClientNumber + ": " + d.data.deviceCount)
				.style("left", (d3.event.pageX + 10) + "px")
				.style("top", (d3.event.pageY - 28) + "px")
				.style("background-color", "#18cd6c");
		})
		.on("mouseout", function(d) {
			tooltip.transition()
				.duration(500)
				.style("opacity", 0);
		});

	// 添加节点图片
	var clickTimer;
	node.append("image")
		.attr("xlink:href", function(d) {
			return d.depth === 0 ? "../root-1.png" : "../node-1.png";
		})
		.attr("x", function(d) {
			return d.depth === 0 ? -30 : -20;
		})
		.attr("y", function(d) {
			if(d.depth === 2)
				return -100;
			else
				return d.depth === 0 ? 0 : -38;
		})
		.attr("width", function(d) {
			return d.depth === 0 ? 60 : 40;
		})
		.attr("height", function(d) {
			return d.depth === 0 ? 60 : 38;
		})
		.on("mouseover", function(d) {
			if (d.depth === 0) {
				d3.select(this)
					.attr("xlink:href", "../root-2.png");
			} else {
				d3.select(this)
					.attr("xlink:href", "../node-2.png");
			}
		})
		.on("mouseout", function(d) {
			d3.select(this)
				.attr("xlink:href", function(d) {
					return d.depth === 0 ? "../root-1.png" : "../node-1.png";
				});
		})
		.on("dblclick",function(d) {
			clearTimeout(clickTimer);
			if (d.depth !== 0) 
				redirect_agent(d.data.IP);
		})
		.on("click",function(d) {
			clearTimeout(clickTimer);
			clickTimer = setTimeout(function() {
				popup_topo_detail(d.data.index);
			}, 300);
		});
	}
}
window.addEventListener("load", init);
