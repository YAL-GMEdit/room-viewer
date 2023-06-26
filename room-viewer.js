(function() {
	//
	const FileKind = $gmedit["file.FileKind"];
	const Editor = $gmedit["editors.Editor"];
	
	function endi(val) {
		return val ? "enabled" : "disabled";
	}
	function endip(val) {
		return "(" + (val ? "enabled" : "disabled") + ")";
	}
	function addText(out, text) {
		out.appendChild(document.createTextNode(text));
	}
	function addDetails(out, title, open) {
		let details = document.createElement("details");
		if (open != false) details.open = true;
		let summary = document.createElement("summary");
		summary.appendChild(document.createTextNode(title));
		details.appendChild(summary);
		out.appendChild(details);
		return details;
	}
	function addValueDiv(out, label, value) {
		let div = document.createElement("div");
		let bold = document.createElement("b");
		bold.innerText = label + ":";
		div.appendChild(bold);
		div.appendChild(document.createTextNode(" " + JSON.stringify(value, null, " ")));
		out.appendChild(div);
	}
	function addColorDiv(out, label, value) {
		let r = (value) & 0xFF;
		let g = (value >> 8) & 0xFF;
		let b = (value >> 16) & 0xFF;
		let a = (value >>> 24) & 0xFF;
		let rgb = `rgb(${r}, ${g}, ${b})`;
		let div = document.createElement("div");
		
		let bold = document.createElement("b");
		bold.innerText = label + ":";
		div.appendChild(bold);
		addText(div, " ");
		
		let cq = document.createElement("span")
		cq.className = "color-square";
		cq.style.backgroundColor = rgb;
		div.appendChild(cq);
		
		addText(div, ` ${r},${g},${b},${a}`);
		out.appendChild(div);
	}
	function addFieldDiv(out, obj, key, label) {
		let div = document.createElement("div");
		let bold = document.createElement("b");
		if (label == null) label = key.charAt(0).toUpperCase() + key.substring(1);
		bold.innerText = label + ":";
		div.appendChild(bold);
		div.appendChild(document.createTextNode(" " + JSON.stringify(obj[key])));
		out.appendChild(div);
	}
	function addObjectDetails(out, obj, title) {
		let det = addDetails(out, title);
		for (let key of Object.keys(obj)) {
			addFieldDiv(det, obj, key);
		}
	}
	function addLayerRec_1(out, layer, summary) {
		switch (layer.resourceType) {
			case "GMRLayer":
				for (let subLayer of layer.layers) addLayerRec(out, subLayer);
			break;
			case "GMRPathLayer":
				addText(summary, ", " + (layer.pathId?.name ?? "N/A"));
			break;
			case "GMRBackgroundLayer":
				addText(summary, ", " + (layer.spriteId?.name ?? "solid color"));
				addColorDiv(out, "Color", layer.colour);
			break;
			case "GMRInstanceLayer":
				addText(summary, ", " + layer.instances.length + " instance"
					+ (layer.instances.length != 1 ? "s" : ""));
				for (let inst of layer.instances) {
					let id = addDetails(out, inst.name + " ("
						+ inst.objectId.name + " at " + inst.x + ", " + inst.y
					+ ")", false);
					addColorDiv(id, "Color", inst.colour);
					addFieldDiv(id, inst, "rotation");
					addValueDiv(id, "Scale", [inst.scaleX, inst.scaleY]);
				}
			break;
			case "GMRAssetLayer":
				addText(summary, ", " + layer.assets.length + " image"
					+ (layer.assets.length != 1 ? "s" : ""));
				for (let img of layer.assets) {
					let id = addDetails(out, img.name + " ("
						+ (img.spriteId?.name ?? "?") + " at " + img.x + ", " + img.y
					+ ")", false);
					addColorDiv(id, "Color", img.colour);
					addFieldDiv(id, img, "rotation");
					addValueDiv(id, "Scale", [img.scaleX, img.scaleY]);
				}
			break;
		}
	}
	function addLayerRec(out, layer) {
		let open = layer.resourceType == "GMRLayer";
		out = addDetails(out, layer.name + " (" + endi(layer.visible), open);
		out.classList.add("layer");
		let summary = out.querySelector("summary");
		try {
			addLayerRec_1(out, layer, summary);
		} catch (e) {
			addValueDiv(out, "Load error", "" + e);
		}
		addText(summary, ")");
	}
	
	function RoomViewer(file) {
		Editor.call(this, file);
		this.element = document.createElement("div");
		this.element.classList.add("room-hierarchy-viewer");
	}
	RoomViewer.prototype =  GMEdit.extend(Editor.prototype, {
		load: function(data) {
			const json = this.file.readContent();
			const room = $gmedit["yy.YyJson"].parse(this.file.readContent());
			let root = this.element;
			let out;
			
			const expand = document.createElement("input");
			expand.type = "button";
			expand.value = "Expand layers";
			expand.onclick = () => {
				for (let el of root.querySelectorAll("details.layer")) {
					el.open = true;
				}
			}
			root.appendChild(expand);
			
			const roomSettings = room.roomSettings;
			out = addDetails(root, "Room settings");
			addFieldDiv(out, roomSettings, "Width");
			addFieldDiv(out, roomSettings, "Height");
			addFieldDiv(out, roomSettings, "persistent");
			
			const viewSettings = room.viewSettings;
			const viewDetails = addDetails(root, "Views " + endip(viewSettings.enableViews));
			room.views.forEach((view, vi) => {
				out = addDetails(viewDetails, `View ${vi} ` + endip(view.visible), false);
				addValueDiv(out, "View", [view.xview, view.yview, view.wview, view.hview]);
				addValueDiv(out, "Port", [view.xport, view.yport, view.wport, view.hport]);
			});
			
			out = addDetails(root, "Layers");
			for (let layer of room.layers) addLayerRec(out, layer);
		}
	});
	
	//
	function KRoom() {
		FileKind.call(this);
	}
	KRoom.prototype = GMEdit.extend(FileKind.prototype, {
		init: function(file, data) {
			file.editor = new RoomViewer(file);
		}
	});
	//
	GMEdit.register("room-viewer", {
		init: function() {
			const kind = new KRoom();
			$gmedit["file.kind.KYy"].register("GMRoom", kind);
		}
	});
})();
