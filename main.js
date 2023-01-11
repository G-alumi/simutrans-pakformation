const HTML_INPUT_FILE = document.getElementById("input_file");
const HTML_SLELCT_IMPORT_ADOON = document.getElementById("select_inportaddon")
const HTML_SLELCT_EXPORT_ADOON = document.getElementById("select_outputaddon")
const HTML_SELECT_FILE = document.getElementById("select_file")
const HTML_BUTTON_ADD_ADDON = document.getElementById("button_add_addon")
const HTML_BUTTON_DEL_ADDON = document.getElementById("button_del_addon")
const HTML_BUTTON_EXPORT_ADDON = document.getElementById("button_export_addon")

const SIMUTANS_PAK_HEADER = new Uint8Array([0x53,0x69,0x6D,0x75,0x74,0x72,0x61,0x6E,0x73,0x20,0x6F,0x62,0x6A,0x65,0x63,0x74,0x20,0x66,0x69,0x6C,0x65,0x0A,0x43,0x6F,0x6D,0x70,0x69,0x6C,0x65,0x64,0x20,0x77,0x69,0x74,0x68,0x20,0x53,0x69,0x6D,0x4F,0x62,0x6A,0x65,0x63,0x74,0x73,0x20,0x30,0x2E,0x31,0x2E,0x33,0x65,0x78,0x70,0x0A,0x1A])

let inportFileContents = [];
let inportAddons = [];
let exportAddons = [];
let select_imput_addon = [];
let select_output_addon = [];
let select_imput_addon_Shift_index = -1;
let select_output_addon_Shift_index = -1;

class Addon{
	constructor(name,binary,fileDate,fileName) {
		this.name = name;
		this.binary = binary;
		this.file = {date:fileDate,name:fileName}
		this.add = false;
	}
	getAdd() {
		return this.add;
	}
	setAdd() {
		this.add = !this.add
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


HTML_INPUT_FILE.addEventListener("change",() => {
	for(file of HTML_INPUT_FILE.files){
		console.log(file)
		let reader = new FileReader();
		reader.readAsArrayBuffer(file);
		reader.onload = ()=> {
			//ファイル選択用の項目を作成
			const ADDON_FILE = new Uint8Array(reader.result)
			const fileName = file.name
			const fileDate = file.lastModified
			console.log(fileName)
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
		//delete reader
	}
});

HTML_SELECT_FILE.addEventListener("change", chageFile);

function chageFile(){
	HTML_SLELCT_IMPORT_ADOON.innerHTML = "<tr><th></th><th>アドオン</th><th>ソースファイル</th><th>ソースファイル日時</th></tr>";
	if (inportAddons.length > 0){
		inportAddons.forEach((value,index) => {
			const ELEMENT_TR = document.createElement("tr");
			ELEMENT_TR.setAttribute("id","import_" + index);
			ELEMENT_TR.setAttribute("onClick","importTrClick("+ index +",event)");

			const ELEMENT_TD_CHECK = document.createElement("td");
			const ELEMENT_CHECK = document.createElement("input");
			ELEMENT_CHECK.setAttribute("type","checkbox");
			ELEMENT_CHECK.setAttribute("id","import_check_"+ index);
			ELEMENT_CHECK.setAttribute("disabled","");
			ELEMENT_TD_CHECK.appendChild(ELEMENT_CHECK);
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


	})

	}
}

function importTrClick(index,event){
	document.getElementById("import_check_" + index).checked = !document.getElementById("import_check_" + index).checked;
	if (document.getElementById("import_check_" + index).checked && select_imput_addon.indexOf(index) == -1){
		select_imput_addon.push(index);
	}
	if (!(document.getElementById("import_check_" + index).checked)){
		select_imput_addon = select_imput_addon.filter(content => content != index);
	}
	if (event.shiftKey){
		if (select_imput_addon_Shift_index >= 0){
			Array.from(HTML_SLELCT_IMPORT_ADOON.children).forEach((value) => {
				if(value.tagName == "TR" && Math.min(select_imput_addon_Shift_index,index) <= value.id.slice("import_".length) && value.id.slice("import_".length) <= Math.max(select_imput_addon_Shift_index,index)){
					if(document.getElementById("import_check_" + select_imput_addon_Shift_index).checked){
						document.getElementById("import_check_" + value.id.slice("import_".length)).checked = true
						select_imput_addon.push(Number(value.id.slice("import_".length)))
					}else{
						document.getElementById("import_check_" + value.id.slice("import_".length)).checked = false
						select_imput_addon = select_imput_addon.filter(content => content != value.id.slice("import_".length));
					}
				}
			})
			select_imput_addon = Array.from(new Set(select_imput_addon)).sort(compareNumbers);
		}
	}
	select_imput_addon_Shift_index = index;
}

function exportTrClick(index,event){
	document.getElementById("export_check_" + index).checked = !document.getElementById("export_check_" + index).checked;
	if (document.getElementById("export_check_" + index).checked && select_output_addon.indexOf(index) == -1){
		select_output_addon.push(index);
	}
	if (!(document.getElementById("export_check_" + index).checked)){
		select_output_addon = select_output_addon.filter(content => content != index);
	}
	if (event.shiftKey){
		if (select_output_addon_Shift_index >= 0){

			Array.from(HTML_SLELCT_EXPORT_ADOON.children).forEach((value) => {
				if(value.tagName == "TR" && Math.min(select_output_addon_Shift_index,index) <= value.id.slice("export_".length) && value.id.slice("export_".length) <= Math.max(select_output_addon_Shift_index,index)){
					console.log(value.id)
					if(document.getElementById("export_check_" + select_output_addon_Shift_index).checked){
						document.getElementById("export_check_" + value.id.slice("export_".length)).checked = true
						select_output_addon.push(Number(value.id.slice("export_".length)))
					}else{
						document.getElementById("export_check_" + value.id.slice("export_".length)).checked = false
						select_output_addon = select_output_addon.filter(content => content != value.id.slice("export_".length));
					}
				}
			})
			select_output_addon = Array.from(new Set(select_output_addon)).sort(compareNumbers);
		}
	}
	select_output_addon_Shift_index = index;
}

HTML_BUTTON_ADD_ADDON.addEventListener("click", function(){
	HTML_SLELCT_EXPORT_ADOON.innerHTML = "<tr><th></th><th>アドオン</th><th>ソースファイル</th><th>ソースファイル日時</th></tr>";
	select_imput_addon.sort(compareNumbers).forEach((value) => {
		inportAddons[value].add = true
		document.getElementById("import_check_" + value).checked = false;

		const ELEMENT_TR = document.createElement("tr");
		ELEMENT_TR.setAttribute("id","export_" + value);
		ELEMENT_TR.setAttribute("onClick","exportTrClick("+ value +",event)");
	
		const ELEMENT_TD_CHECK = document.createElement("td");
		const ELEMENT_CHECK = document.createElement("input");
		ELEMENT_CHECK.setAttribute("type","checkbox");
		ELEMENT_CHECK.setAttribute("id","export_check_"+ value);
		ELEMENT_CHECK.setAttribute("disabled","");
		if (select_output_addon.indexOf(value) >= 0){
			ELEMENT_CHECK.checked = true
		}
		ELEMENT_TD_CHECK.appendChild(ELEMENT_CHECK);
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
});

HTML_BUTTON_DEL_ADDON.addEventListener("click", function(){
	select_output_addon.forEach((value) => {
		select_imput_addon = select_imput_addon.filter(content => content != value);
	})
	HTML_SLELCT_EXPORT_ADOON.innerHTML = "<tr><th></th><th>アドオン</th><th>ソースファイル</th><th>ソースファイル日時</th></tr>";
	select_imput_addon.sort(compareNumbers).forEach((value) => {
		inportAddons[value].add = true

		const ELEMENT_TR = document.createElement("tr");
		ELEMENT_TR.setAttribute("id","export_" + value);
		ELEMENT_TR.setAttribute("onClick","exportTrClick("+ value +",event)");
	
		const ELEMENT_TD_CHECK = document.createElement("td");
		const ELEMENT_CHECK = document.createElement("input");
		ELEMENT_CHECK.setAttribute("type","checkbox");
		ELEMENT_CHECK.setAttribute("id","export_check_"+ value);
		ELEMENT_CHECK.setAttribute("disabled","");
		ELEMENT_TD_CHECK.appendChild(ELEMENT_CHECK);
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
	select_output_addon = [];
});

function addonExport(indexList){
	let exportBinary = Array.from(SIMUTANS_PAK_HEADER)
	let intToBinary = ("00000000"+(1003).toString(16)).slice(-8)
	for(let i = 0; i < 4; i++){
		exportBinary.push(Number("0x" + intToBinary.slice(6-(i*2),8-(i*2))))
	}
	new TextEncoder().encode("ROOT").forEach(value => exportBinary.push(value))
	intToBinary = ("0000"+(indexList.length).toString(16)).slice(-4)
	for(let i = 0; i < 4; i++){
		exportBinary.push(Number("0x" + intToBinary.slice(2-(i*2),4-(i*2))))
	}
	indexList.forEach((value) => {
		exportBinary = exportBinary.concat(Array.from(inportAddons[value].binary))
	})
	return new Uint8Array(exportBinary)
}

HTML_BUTTON_EXPORT_ADDON.addEventListener("click", function(){
	let exportList = []
	Array.from(HTML_SLELCT_EXPORT_ADOON.children).forEach((value) => {
		if(value.tagName == "TR"){
			exportList.push(Number(value.id.slice("export_".length)))
		}
	})
	console.log(addonExport(exportList))
	const blob = new Blob([addonExport(exportList)],{type:"application/octet-stream"});
	const link = document.createElement("a");
	link.download = "Export.pak";
	link.href = URL.createObjectURL(blob);
	link.click();
	URL.revokeObjectURL(link.href)
})