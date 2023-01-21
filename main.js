const HTML_INPUT_FILE = document.getElementById("input_file");
const HTML_SLELCT_IMPORT_ADOON = document.getElementById("select_inportaddon")
const HTML_SLELCT_EXPORT_ADOON = document.getElementById("select_outputaddon")
const HTML_SELECT_FILE = document.getElementById("select_file")
const HTML_BUTTON_ADD_ADDON = document.getElementById("button_add_addon")
const HTML_BUTTON_DEL_ADDON = document.getElementById("button_del_addon")
const HTML_BUTTON_EXPORT_ADDON = document.getElementById("button_export_addon")
const HTML_BUTTON_SINGL_ADDON = document.getElementById("button_singl_addon")

const SIMUTANS_PAK_HEADER = new Uint8Array([0x53,0x69,0x6D,0x75,0x74,0x72,0x61,0x6E,0x73,0x20,0x6F,0x62,0x6A,0x65,0x63,0x74,0x20,0x66,0x69,0x6C,0x65,0x0A,0x43,0x6F,0x6D,0x70,0x69,0x6C,0x65,0x64,0x20,0x77,0x69,0x74,0x68,0x20,0x53,0x69,0x6D,0x4F,0x62,0x6A,0x65,0x63,0x74,0x73,0x20,0x30,0x2E,0x31,0x2E,0x33,0x65,0x78,0x70,0x0A,0x1A,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00])

let inportFileContents = [];
let inportAddons = [];
let exportAddons = [];
let select_imput_addon = [[]];
let select_output_addon = [[]];
let select_imput_addon_Shift_index = [-1];
let select_output_addon_Shift_index = [-1];

class Addon{
	constructor(name,binary,fileDate,fileName) {
		this.name = name;
		this.binary = binary;
		this.file = {date:fileDate,name:fileName}
		this.add = false;
	}
	fileSet() {
		return this.file.name+" "+this.file.date
	}
}
//リトルエンディアンを数値にもどすコード
function binaryToInt(list_Uint8){
	let num = 0
	list_Uint8.forEach((value, index) => {
		num += value * (256 ** index)
	 });
	 return num
}

//モジラからパクってきた
function compareNumbers(a, b) {
	return a - b;
}


HTML_INPUT_FILE.addEventListener("change",(event) => {
	for(file of event.target.files){
		let reader = new FileReader();
		const fileName = file.name
		const fileDate = file.lastModified
		reader.onload = ()=> {
			//ファイル選択用の項目を作成
			const ADDON_FILE = new Uint8Array(reader.result)
			let addonList = []
			let duplication = false

			//ここから読んだファイルをいじる　これはポインタを初期化している
			let position = 0
			//スライスしてポインタを進める関数
			function sliceAndMove(ary, num){
				let r = ary.slice(position, position + num);
				position += num
				return r
			}
			//ファイル比較してダブり判定をする
			for(value of inportAddons){
				if(value.file.date == fileDate && value.file.name == fileName){
					duplication = true
					console.log("ダブり")
					break;
				}
			}
			//ダブってなければ処理
			if (!(duplication)){
				const FILE_NAME = document.createElement("option")
				FILE_NAME.setAttribute("value",fileName+" "+fileDate)
				FILE_NAME.innerHTML = fileName+" "+fileDate
				HTML_SELECT_FILE.appendChild(FILE_NAME);
				//ヘッダーの抽出
				console.log("header", new TextDecoder().decode(sliceAndMove(ADDON_FILE, 57)));
				console.log("PakVersion",binaryToInt(sliceAndMove(ADDON_FILE,4)));
	
				//ROOT 4バイト 子ノード 2バイト ノード長 2バイト
				position += 4+2+2

				//ファイルの最後まで回す
				for (;position<ADDON_FILE.length;){
					let progress = 0
					let singleAddonName
					let singleAddonBinary = []
		
					//FEの試験に出そうな変数iの使い方してて草
					for(i = 0;;i --){
						//ノード種類 4バイト
						let nodeType = sliceAndMove(ADDON_FILE,4)
						nodeType.forEach((value) => {
							singleAddonBinary.push(value)
						});
						//子ノード 2バイト
						let childNoodsNum = sliceAndMove(ADDON_FILE,2);
						childNoodsNum.forEach((value) => {
							singleAddonBinary.push(value)
						});
						i += binaryToInt(childNoodsNum)
						//ノードの大きさ 2バイト ただし2バイトで表せない場合、頭2バイトFF FF そのあと4バイト(大きな画像など・要検証)
						let nodeSize = sliceAndMove(ADDON_FILE,2);
						nodeSize.forEach((value) => {
							singleAddonBinary.push(value)
						});
						if(binaryToInt(nodeSize) == 65535){
							nodeSize = sliceAndMove(ADDON_FILE,4);
							nodeSize.forEach((value) => {
								singleAddonBinary.push(value)
							});
						}
						//2つ目のノード(XXXX/TEXT)にアドオン名が格納されているので取得
						if(progress == 1){
							let addonName = sliceAndMove(ADDON_FILE,binaryToInt(nodeSize));
							addonName.forEach((value) => {
								singleAddonBinary.push(value)
							});
							singleAddonName = new TextDecoder().decode(addonName);
						}else{
							sliceAndMove(ADDON_FILE,binaryToInt(nodeSize)).forEach((value) => {
								singleAddonBinary.push(value)
							});
							
						}
						progress ++;
						if(i <= 0)break;
					}
				inportAddons.push(new Addon(singleAddonName,new Uint8Array(singleAddonBinary),fileDate,fileName));
				}
				chageFile();
			}
		}
		reader.readAsArrayBuffer(file);
		delete reader
	}
});

HTML_SELECT_FILE.addEventListener("change", chageFile);

function chageFile(){
	HTML_SLELCT_IMPORT_ADOON.innerHTML = "<thead><tr><th></th><th>アドオン</th><th>ソースファイル</th><th>ソースファイル日時</th></tr></thead>";
	if (inportAddons.length > 0){
		inportAddons.forEach((value,index) => {
			if (HTML_SELECT_FILE.value == "all" || (HTML_SELECT_FILE.value == value.fileSet())){
				const ELEMENT_TR = document.createElement("tr");
				ELEMENT_TR.setAttribute("id","import_" + index);
				ELEMENT_TR.setAttribute("onClick","importTrClick("+ index +",event)");

				const ELEMENT_TD_CHECK = document.createElement("td");
				const ELEMENT_CHECK = document.createElement("input");
				const ELEMENT_CHECK_DUMMY = document.createElement("div");
				ELEMENT_CHECK.setAttribute("type","checkbox");
				ELEMENT_CHECK.setAttribute("disabled","");
				if (select_imput_addon[0].indexOf(index) >= 0){
					ELEMENT_CHECK.checked = true
				}
				ELEMENT_TD_CHECK.appendChild(ELEMENT_CHECK);
				ELEMENT_TD_CHECK.appendChild(ELEMENT_CHECK_DUMMY);
				ELEMENT_TR.appendChild(ELEMENT_TD_CHECK);

				const ELEMENT_TD_ADOONNAME = document.createElement("td");
				ELEMENT_TD_ADOONNAME.textContent = value.name.slice(0,-1);
				ELEMENT_TR.appendChild(ELEMENT_TD_ADOONNAME);

				const ELEMENT_TD_FILENAME = document.createElement("td");
				ELEMENT_TD_FILENAME.textContent = value.file.name;
				ELEMENT_TR.appendChild(ELEMENT_TD_FILENAME);

				const ELEMENT_TD_FILEDDATE = document.createElement("td");
				ELEMENT_TD_FILEDDATE.textContent = value.file.date;
				ELEMENT_TR.appendChild(ELEMENT_TD_FILEDDATE);
				
				HTML_SLELCT_IMPORT_ADOON.appendChild(ELEMENT_TR);
			}else{
				select_imput_addon[0] = select_imput_addon[0].filter(content => content != index);
			}
	})

	}
}

function importTrClick(index,event){
	trClick("in",index,event)
}
function exportTrClick(index,event){
	trClick("ex",index,event)
}

function trClick(flag,index,event){
	let XXport_
	let select_addon
	let select_addon_Shift_index
	let HTML_SLELCT_ADOON
	if(flag == "in"){
		XXport_ = "import_"
		select_addon = select_imput_addon
		select_addon_Shift_index = select_imput_addon_Shift_index
		HTML_SLELCT_ADOON = HTML_SLELCT_IMPORT_ADOON
	}else if(flag == "ex"){
		XXport_ = "export_"
		select_addon = select_output_addon
		select_addon_Shift_index = select_output_addon_Shift_index
		HTML_SLELCT_ADOON = HTML_SLELCT_EXPORT_ADOON
	}else{
		return
	}
	function checkbox(index){return document.getElementById(XXport_ + index).children[0].children[0];}
	checkbox(index).checked = !checkbox(index).checked;
	if (checkbox(index).checked && select_addon[0].indexOf(index) == -1){
		select_addon[0].push(index);
	}
	if (!(checkbox(index).checked)){
		select_addon[0] = select_addon[0].filter(content => content != index);
	}
	if (event.shiftKey){
		if (select_addon_Shift_index[0] >= 0){
			Array.from(HTML_SLELCT_ADOON.children).forEach((value) => {
				const ID_NUMBER = Number(value.id.slice(XXport_.length))
				if(value.tagName == "TR" && Math.min(select_addon_Shift_index[0],index) <= ID_NUMBER && ID_NUMBER <= Math.max(select_addon_Shift_index[0],index)){
					if(checkbox(select_addon_Shift_index[0]).checked){
						checkbox(ID_NUMBER).checked = true
						select_addon[0].push(ID_NUMBER)
					}else{
						checkbox(ID_NUMBER).checked = false
						select_addon[0] = select_addon[0].filter(content => content != ID_NUMBER);
					}
				}
			})
			select_addon[0] = Array.from(new Set(select_addon[0])).sort(compareNumbers);
		}
	}
	select_addon_Shift_index[0] = index;
}

function displayExportTable(){
	HTML_SLELCT_EXPORT_ADOON.innerHTML = "<thead><tr><th></th><th>アドオン</th><th>ソースファイル</th><th>ソースファイル日時</th></tr></thead>";
	exportAddons.sort(compareNumbers).forEach((value) => {
		inportAddons[value].add = true
		document.getElementById("import_" + value).children[0].children[0].checked = false;

		const ELEMENT_TR = document.createElement("tr");
		ELEMENT_TR.setAttribute("id","export_" + value);
		ELEMENT_TR.setAttribute("onClick","exportTrClick("+ value +",event)");
	
		const ELEMENT_TD_CHECK = document.createElement("td");
		const ELEMENT_CHECK = document.createElement("input");
		const ELEMENT_CHECK_DUMMY = document.createElement("div");
		ELEMENT_CHECK.setAttribute("type","checkbox");
		ELEMENT_CHECK.setAttribute("disabled","");
		if (select_output_addon[0].indexOf(value) >= 0){
			ELEMENT_CHECK.checked = true
		}
		ELEMENT_TD_CHECK.appendChild(ELEMENT_CHECK);
		ELEMENT_TD_CHECK.appendChild(ELEMENT_CHECK_DUMMY);
		ELEMENT_TR.appendChild(ELEMENT_TD_CHECK);
	
		const ELEMENT_TD_ADOONNAME = document.createElement("td");
		ELEMENT_TD_ADOONNAME.textContent = inportAddons[value].name.slice(0,-1);
		ELEMENT_TR.appendChild(ELEMENT_TD_ADOONNAME);
	
		const ELEMENT_TD_FILENAME = document.createElement("td");
		ELEMENT_TD_FILENAME.textContent = inportAddons[value].file.name;
		ELEMENT_TR.appendChild(ELEMENT_TD_FILENAME);
	
		const ELEMENT_TD_FILEDDATE = document.createElement("td");
		ELEMENT_TD_FILEDDATE.textContent = inportAddons[value].file.date;
		ELEMENT_TR.appendChild(ELEMENT_TD_FILEDDATE);
				
		HTML_SLELCT_EXPORT_ADOON.appendChild(ELEMENT_TR);
	})

}

HTML_BUTTON_ADD_ADDON.addEventListener("click", function(){
	exportAddons = Array.from(new Set(exportAddons.concat(select_imput_addon[0])))
	displayExportTable()
	select_imput_addon = [[]];
});

HTML_BUTTON_DEL_ADDON.addEventListener("click", function(){
	select_output_addon[0].forEach((value) => {
		exportAddons = exportAddons.filter(content => content != value);
	})
	displayExportTable()
	select_output_addon = [[]];
});

function addonExport(indexList){
	let position = 57
	let exportBynaryLen = SIMUTANS_PAK_HEADER.length
	indexList.forEach((value) => {
		exportBynaryLen += inportAddons[value].binary.length
	})
	let exportBinary = new Uint8Array(exportBynaryLen)

	SIMUTANS_PAK_HEADER.forEach((value,index) => {
		exportBinary[index] = value
	})

	let intToBinary = ("00000000"+(1003).toString(16)).slice(-8)
	for(let i = 0; i < 4; i++){
		exportBinary[position] = Number("0x" + intToBinary.slice(8-2-(i*2),8-(i*2)))
		position ++
	}
	new TextEncoder().encode("ROOT").forEach((value) => {
		exportBinary[position] = value
		position ++
	})
	intToBinary = ("0000"+(indexList.length).toString(16)).slice(-4)
	for(let i = 0; i < 2; i++){
		exportBinary[position] = Number("0x" + intToBinary.slice(4-2-(i*2),4-(i*2)))
		position ++
	}
	intToBinary = ("0000").slice(-4)
	for(let i = 0; i < 2; i++){
		exportBinary[position] = Number("0x" + intToBinary.slice(4-2-(i*2),4-(i*2)))
		position ++
	}
	indexList.forEach((value) => {
		inportAddons[value].binary.forEach((bynary) => {
			exportBinary[position] = bynary
			position ++
		})
	})
	return exportBinary
}

HTML_BUTTON_EXPORT_ADDON.addEventListener("click", function(){
	let exportList = []
	Array.from(HTML_SLELCT_EXPORT_ADOON.children).forEach((value) => {
		if(value.tagName == "TR"){
			exportList.push(Number(value.id.slice("export_".length)))
		}
	})
	if (exportList.length == 0){
		return
	}
	const blob = new Blob([addonExport(exportList)],{type:"application/octet-stream"});
	let zip = new JSZip()
	zip.file("addon.pak",blob)
	zip.generateAsync({type:"blob",compression:"DEFLATE"})
		.then(function(value){
	const link = document.createElement("a");
	link.download = "Export.zip";
	link.href = URL.createObjectURL(value);
	link.click();
	URL.revokeObjectURL(link.href);}
	)
})

HTML_BUTTON_SINGL_ADDON.addEventListener("click", function(){
	console.log(select_imput_addon[0])
	let zip = new JSZip()
	select_imput_addon[0].forEach((value) => {
		const blob = new Blob([addonExport([value])],{type:"application/octet-stream"});
		zip.file(inportAddons[value].name.slice(0,-1).replace( /[\\\/:\*\?\"\|]/, "_").replace( /[<]/, "(").replace( /[>]/, ")") + ".pak",blob)
	})
	zip.generateAsync({type:"blob",compression:"DEFLATE"})
		.then(function(value){
			const link = document.createElement("a");
		link.download = "Export.zip";
		link.href = URL.createObjectURL(value);
		link.click();
		URL.revokeObjectURL(link.href);}
		)
})