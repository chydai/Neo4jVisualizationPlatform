

$(document).ready(function(){

    // showAllCytoscape
    $.get('/graph', function(result) {

        //alert(result.elements.edges[0].data['relationship']);
        //alert(result.elements.nodes.length);
        //showAllCytoscape(result);

    }, 'json');

    // 癌症特异网络cytoscape子图的选择
    $("#showgene").click(function(){
        var getgene = $('#gene').val();
        var gene= {
            data: JSON.stringify({
                'gene': getgene,
            }),
        }

        $.ajax({
            url:"/gene",
            type:"get",
            data:gene,
            dataType:'json',
            success:function(result){

                showCytoscape(result, getgene, 'grid');

            },
            error:function(){
                alert("An error occurred!");
            }
        });

    });

    // 根据hallmark从新绘制图
    $("#showhallmark").click(function(){

        var hallmark = $("#hallmark").val();

        gradientColorShowDown();

        cy.nodes('['+ hallmark + '= "1"]').style('background-color', '#FFA500');
        cy.nodes('['+ hallmark + '= "1"]').style('color', '#FFA500');
        cy.nodes('['+ hallmark + '= "1"]').style('opacity', 1);
        cy.nodes('['+ hallmark + '= "1"]').style('width', 16);
        cy.nodes('['+ hallmark + '= "1"]').style('height', 16);
        //cy.edges('[relationship = "r"]').style('line-color', '#FFA500');

    });

    // 路线搜索的开始结束的节点选择
    $("#subweb").click(function(){
        var getgene = $('#gene').val();
        var startnote = $('#startnote').val();
        var endnote = $('#endnote').val();
        var subwebnotes= {
            data: JSON.stringify({
                'gene':getgene,
                'startnote': startnote,
                'endnote': endnote
            }),
        }

        $.ajax({
            url:"/subweb",
            type:"get",
            data:subwebnotes,
            dataType:'json',
            success:function(result){

                if(result == 0){
                    alert("NONE");
                } else {
                    showCytoscape(result, getgene,'circle');
                }

            },
            error:function(){
                alert("An error occurred!");
            }
        });
    });

    // show key nodes 上色
    $("#keynode").click(function () {
		//var box_key_node = document.getElementById("keynode");
        if(this.checked == true){
//            var getgene = $('#gene').val();
//            var gene= {
//                data: JSON.stringify({
//                    'gene': getgene,
//                }),
//            }
//
//            $.ajax({
//                url:"/gene",
//                type:"get",
//                data:gene,
//                dataType:'json',
//                success:function(result){
//                    showCytoscape(result, gene,'grid');
//                    cy.nodes('[ core = "1"]').style('background-color', '#FFA500');
//                    cy.nodes('[ core = "1"]').style('color', '#FFA500');
//                },
//                error:function(){
//                    alert("An error occurred!");
//                }
//            });
            gradientColorShowDown();
            cy.nodes('[ core = "1"]').style('background-color', '#FFA500');
            cy.nodes('[ core = "1"]').style('color', '#FFA500');
            cy.nodes('[ core = "1"]').style('opacity', 1);
            cy.nodes('[ core = "1"]').style('width', 16);
            cy.nodes('[ core = "1"]').style('height', 16);

        }else{
            // 取消复选框时的操作
            gradientColorShowNotes();
            gradientColorShowEdges();
        }
	});

	// show key nodes 从新绘制图
    $("#showkeynodes").click(function(){
        var getgene = $('#gene').val();
        var gene= {
            data: JSON.stringify({
                'gene': getgene,
            }),
        }

        $.ajax({
            url:"/keynode",
            type:"get",
            data:gene,
            dataType:'json',
            success:function(result){

                showCytoscape(result, getgene, 'grid');

            },
            error:function(){
                alert("An error occurred!");
            }
        });

    });

	// show drug
    $("#drug").click(function () {
		//var box_key_node = document.getElementById("keynode");
        if(this.checked == true){

            var getgene = $('#gene').val();
            var gene= {
                data: JSON.stringify({
                    'gene': getgene,
                }),
            }

            $.ajax({
                url:"/drug",
                type:"get",
                data:gene,
                dataType:'json',
                success:function(result){

                    // result.elements.nodes[0].data['id']
                    // result.elements.edges[0].data['drug']
                    // alert(result.elements.nodes.length);
                    gradientColorShowDown();
                    for(var i = 0; i < result.elements.nodes.length; i++){
                        cy.nodes('[ id = "' + result.elements.nodes[i].data["id"] + '" ]').style('background-color', '#555555');
                        cy.nodes('[ id = "' + result.elements.nodes[i].data["id"] + '" ]').style('color', '#555555');
                        cy.nodes('[ id = "' + result.elements.nodes[i].data["id"] + '" ]').style('opacity', 1);
                    }
                    cy.edges('[ drug = "1"]').style('line-color', '#555555');
                    cy.edges('[ drug = "1"]').style('target-arrow-color', '#555555');
                    cy.edges('[ drug = "1"]').style('width', 2);

                },
                error:function(){

                    alert("An error occurred! (DRUG)");

                }
            });

        }else{
            // 取消复选框时的操作
            var getgene = $('#gene').val();
            var gene= {
                data: JSON.stringify({
                    'gene': getgene,
                }),
            }

            $.ajax({
                url:"/gene",
                type:"get",
                data:gene,
                dataType:'json',
                success:function(result){
                    showCytoscape(result, gene, 'grid');
                },
                error:function(){
                    alert("An error occurred!");
                }
            });
        }
	});

});

//    window.onload = function(){
//        var gradient = new gradientColor('#FF0000', '#0000FF', 10);
//        console.log(gradient);
//        //alert(gradient);
//        for(var i= 0,j= 0;i<=100;i++){
//            var div = document.createElement("div");
//            div.style.position = "absolute";
//            div.style.width = "50px";
//            div.style.height = "50px";
//            div.style.left = ((i%10)*50+10)+"px";
//            div.style.border = "1px solid #ddd";
//            div.style.backgroundColor = gradient[i];
//            div.innerText = i;
//            if(i%10==0){
//                ++j;
//            }
//            div.style.top = ((j-1)*50+10)+"px";
//            document.body.appendChild(div);
//        }
//    }




// 画18种癌症特异网络cytoscape图
function showAllCytoscape(data){
//将cytoscape样式定义为变量cy
    var cy = window.cy = cytoscape({
        container: document.getElementById('cy'),	  // 定义需要渲染的容器
        style:cytoscape.stylesheet()
            .selector('node').css({
                'label': 'data(name)',
                'text-valign': 'up',
                'color': '#87CEEB',
                'opacity': 1,
                "font-size": "9px",
                "width": 8,
                "height": 8,
                'background-color': '#87CEEB'}) //节点样式
            .selector('edge').css({
                'width':0.5,
                'curve-style': 'bezier',
                'target-arrow-shape': 'triangle',
                'line-color': '#D3D3D3',
                'target-arrow-color': '#D3D3D3',
                //'content': 'data(w)'
                }) //边线样式
            .selector(':selected').css({
                'background-color': 'black',
                'line-color': 'black',
                'target-arrow-color': 'black',
                'source-arrow-color': 'black',
                'opacity': 1}) //点击后节点与边的样式
            .selector('.faded').css({
                'opacity': 0.25,
                'text-opacity': 0}),
        layout: {
            name: 'grid',
            idealEdgeLength: 100,
            nodeOverlap: 20,
            refresh: 20,
            fit: true,
            padding: 30,
            randomize: false,
            componentSpacing: 100,
            nodeRepulsion: 400000,
            edgeElasticity: 100,
            nestingFactor: 5,
            gravity: 80,
            numIter: 1000,
            initialTemp: 200,
            coolingFactor: 0.95,
            minTemp: 1.0
        },  //画布自适应大小

        elements: data.elements,

        // 初始化视口状态：
        zoom: 1,//图的初始缩放级别。
        pan: { x: 0, y: 0 },//图的初始平移位置。

        // 交互选项：
        minZoom: 1e-50,//图的缩放级别的最小界限。视口不能缩放比这个缩放级别小。
        maxZoom: 1e50,//在图的缩放级别上的最大界限。视口不能缩放比这个缩放级别大。
        zoomingEnabled: true,//定义是否可缩放
        userZoomingEnabled: true,//是否使用事件（如鼠标轮)
        panningEnabled: true,//无论是通过用户事件还是以编程方式来定义是否启用对图表的平移。
        userPanningEnabled: true,//是否允许用户事件（例如拖动图形背景）来平移图表。程序更改对PAN不受此选项的影响。
        boxSelectionEnabled: false,//是否启用了框选择（即，拖动框覆盖并释放它以进行选择）。 如果启用，则用户必须点击以平移图表。
        selectionType: 'single',
        touchTapThreshold: 8,//一种非负整数，它指示用户在触摸设备上轻击手势时可移动的最大允许距离。
        desktopTapThreshold: 4,//一种非负整数，它指示用户在桌面设备上轻击手势时可移动的最大允许距离。
        autolock: false,//定义节点是否可拖动
        autoungrabify: false,
        autounselectify: false,//默认情况下节点是否应该是未分类的（不可变选择状态）（如果为true，则覆盖单个元素状态）。
    });

    // 颜色的渐变显示
    gradientColorShowNotes();
    gradientColorShowEdges();
    cy.nodes('[ log = "0"]').style('background-color', '#000000'); //drug
    cy.nodes('[ log = "0"]').style('color', '#000000');

    // 点击elements处的提醒
    cy.elements().qtip({
        content:
            {text:function(){
                    if ( this.data( 'drug' ) == '0' || this.data( 'drug' ) == '1' ) {
                        return 'Weight: ' + this.data('w')
                    } else {
                        return 'log2FoldChange: ' + this.data('log')
                    }
                },
            title:function(){ return this.data('name') }},
        position: {
            my: 'top center',
            at: 'bottom center'
        },
        style: {
            classes: 'qtip-bootstrap',
            tip: {
                width: 16,
                height: 8
            }
        }
    });

    // call on core,点击空白处的提醒
    cy.qtip({
        content: '空白处',
        position: {
            my: 'top center',
            at: 'bottom center'
        },
        show: {
            cyBgOnly: true
        },
        style: {
            classes: 'qtip-bootstrap',
            tip: {
                width: 16,
                height: 8
            }
        }
    });
}

// 画全局网络cytoscape图
function showCytoscape(data, label, layoutsub){
//将cytoscape样式定义为变量cy
    var cy = window.cy = cytoscape({
        container: document.getElementById('cy'),	  // 定义需要渲染的容器
        style:cytoscape.stylesheet()
            .selector('node').css({
                'label': 'data(name)',
                'text-valign': 'up',
                'color': '#87CEEB',
                'opacity': 1,
                "font-size": "9px",
                "width": 8,
                "height": 8,
                'background-color': '#87CEEB'}) //节点样式
            .selector('edge').css({
                'width':1,
                'curve-style': 'bezier',
                'target-arrow-shape': 'triangle',
                'line-color': '#D3D3D3',
                'target-arrow-color': '#D3D3D3',
                //'content': 'data(w)'
                }) //边线样式
            .selector(':selected').css({
                'background-color': 'black',
                'line-color': 'black',
                'target-arrow-color': 'black',
                'source-arrow-color': 'black',
                'opacity': 1}) //点击后节点与边的样式
            .selector('.faded').css({
                'opacity': 0.25,
                'text-opacity': 0}),
        layout: {
            name: layoutsub,
            idealEdgeLength: 100,
            nodeOverlap: 20,
            refresh: 20,
            fit: true,
            padding: 30,
            randomize: false,
            componentSpacing: 100,
            nodeRepulsion: 400000,
            edgeElasticity: 100,
            nestingFactor: 5,
            gravity: 80,
            numIter: 1000,
            initialTemp: 200,
            coolingFactor: 0.95,
            minTemp: 1.0
        },  //画布自适应大小

        elements: data.elements,

        // 初始化视口状态：
        zoom: 1,//图的初始缩放级别。
        pan: { x: 0, y: 0 },//图的初始平移位置。

        // 交互选项：
        minZoom: 1e-50,//图的缩放级别的最小界限。视口不能缩放比这个缩放级别小。
        maxZoom: 1e50,//在图的缩放级别上的最大界限。视口不能缩放比这个缩放级别大。
        zoomingEnabled: true,//定义是否可缩放
        userZoomingEnabled: true,//是否使用事件（如鼠标轮)
        panningEnabled: true,//无论是通过用户事件还是以编程方式来定义是否启用对图表的平移。
        userPanningEnabled: true,//是否允许用户事件（例如拖动图形背景）来平移图表。程序更改对PAN不受此选项的影响。
        boxSelectionEnabled: false,//是否启用了框选择（即，拖动框覆盖并释放它以进行选择）。 如果启用，则用户必须点击以平移图表。
        selectionType: 'single',
        touchTapThreshold: 8,//一种非负整数，它指示用户在触摸设备上轻击手势时可移动的最大允许距离。
        desktopTapThreshold: 4,//一种非负整数，它指示用户在桌面设备上轻击手势时可移动的最大允许距离。
        autolock: false,//定义节点是否可拖动
        autoungrabify: false,
        autounselectify: false,//默认情况下节点是否应该是未分类的（不可变选择状态）（如果为true，则覆盖单个元素状态）。
    });

    // 颜色的渐变显示
    gradientColorShowNotes();
    gradientColorShowEdges();
    cy.nodes('[ log = "0"]').style('background-color', '#000000');
    cy.nodes('[ log = "0"]').style('color', '#000000');

    // 点击elements处的提醒
    cy.elements().qtip({
        content:
            {text:function(){
                    if ( this.data( 'relationship' ) == 'r' ) {
                        return 'Weight: '+this.data('w')
                    } else {
                        return 'UV_RESPONSE_DN: ' + this.data('urd')
                    }
                },
            title:function(){ return this.data('name') }},
        position: {
            my: 'top center',
            at: 'bottom center'
        },
        style: {
            classes: 'qtip-bootstrap',
            tip: {
                width: 16,
                height: 8
            }
        }
    });

    // call on core,点击空白处的提醒
    cy.qtip({
        content: '空白处',
        position: {
            my: 'top center',
            at: 'bottom center'
        },
        show: {
            cyBgOnly: true
        },
        style: {
            classes: 'qtip-bootstrap',
            tip: {
                width: 16,
                height: 8
            }
        }
    });
}




// 颜色的渐变显示函数
function gradientColorShowNotes(){

    cy.nodes().style('opacity', 1);
    cy.edges().style('opacity', 1);
    cy.nodes().style('width', 8);
    cy.nodes().style('height', 8);

    //节点和路线的渐变颜色显示
    // 8,2。6   -2,-6。4
    var step = 10/100;

    var gradient1 = new gradientColor('#0000FF', '#9999FF', 40);
    var rangeN1 = -6;
    var rangeupN1 = -6 + step;
    cy.nodes('[log<= -6 ]').css({'color':gradient1[0], 'background-color':gradient1[0]});
    for(var i=0; i<40; i++){
        rangeupN1 = rangeN1 + step;
        cy.nodes('[log>'+rangeN1+']').nodes('[log<='+rangeupN1+']').css({'color':gradient1[i], 'background-color':gradient1[i]});
        rangeN1 = rangeN1 + step;
    }

    var gradient2 = new gradientColor('#FF9999', '#FF0000', 60);
    var rangeN2 = 2;
    var rangeupN2 = 2 + step;
    cy.nodes('[log> 8 ]').css({'color':gradient2[59], 'background-color':gradient2[59]});
    for(var i=0; i<60; i++){
        rangeupN2 = rangeN2 + step;
        cy.nodes('[log>'+rangeN2+']').nodes('[log<='+rangeupN2+']').css({'color':gradient2[i], 'background-color':gradient2[i]});
        rangeN2 = rangeN2 + step;
    }

}

// 颜色的渐变显示函数
function gradientColorShowEdges(){

    cy.nodes().style('opacity', 1);
    cy.edges().style('opacity', 1);


    //节点和路线的渐变颜色显示
    //-0.32,1
    var gradient = new gradientColor('#99FF99', '#FF99FF', 1000);
    var step = 1.32/1000;
    var rangeE = -0.32;
    var rangeupE = -0.32 + step;
    for(var i=0; i<1000; i++){
        rangeupE = rangeE + step;
        cy.edges('[w>'+rangeE+']').edges('[w<='+rangeupE+']').css({'line-color':gradient[i], 'target-arrow-color':gradient[i]});
        rangeE = rangeE + step;
    }
}

// 弱化节点的颜色显示
function gradientColorShowDown(){

    cy.nodes().style('opacity', 0.2);
    cy.edges().style('opacity', 0.5);

    //节点和路线的渐变颜色显示
    // 8,2。6   -2,-6。4
    var step = 10/100;

    var gradient1 = new gradientColor('#0000FF', '#9999FF', 40);
    var rangeN1 = -6;
    var rangeupN1 = -6 + step;
    for(var i=0; i<40; i++){
        rangeupN1 = rangeN1 + step;
        cy.nodes('[log>'+rangeN1+']').nodes('[log<='+rangeupN1+']').css({'color':gradient1[i], 'background-color':gradient1[i]});
        rangeN1 = rangeN1 + step;
    }

    var gradient2 = new gradientColor('#FF9999', '#FF0000', 60);
    var rangeN2 = 2;
    var rangeupN2 = 2 + step;
    for(var i=0; i<60; i++){
        rangeupN2 = rangeN2 + step;
        cy.nodes('[log>'+rangeN2+']').nodes('[log<='+rangeupN2+']').css({'color':gradient2[i], 'background-color':gradient2[i]});
        rangeN2 = rangeN2 + step;
    }

}




// 颜色渐变的区间选择
function gradientColor(startColor, endColor, step) {
    startRGB = this.colorRgb(startColor);//转换为rgb数组模式
    startR = startRGB[0];
    startG = startRGB[1];
    startB = startRGB[2];

    endRGB = this.colorRgb(endColor);
    endR = endRGB[0];
    endG = endRGB[1];
    endB = endRGB[2];

    sR = (endR - startR) / step;//总差值
    sG = (endG - startG) / step;
    sB = (endB - startB) / step;

    var colorArr = [];
    for (var i = 0; i < step; i++) {
        //计算每一步的hex值
        var hex = this.colorHex('rgb('+ parseInt((sR * i + startR))+ ',' + parseInt((sG * i + startG))+ ',' + parseInt((sB * i + startB)) + ')');
        colorArr.push(hex);
    }
    return colorArr;
}

// 将hex表示方式转换为rgb表示方式(这里返回rgb数组模式)
gradientColor.prototype.colorRgb = function (sColor) {
    var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    var sColor = sColor.toLowerCase();
    if (sColor && reg.test(sColor)) {
        if (sColor.length === 4) {
            var sColorNew = "#";
            for (var i = 1; i < 4; i += 1) {
                sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
            }
            sColor = sColorNew;
        }
        //处理六位的颜色值
        var sColorChange = [];
        for (var i = 1; i < 7; i += 2) {
            sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)));
        }
        return sColorChange;
    } else {
        return sColor;
    }
};

// 将rgb表示方式转换为hex表示方式
gradientColor.prototype.colorHex = function (rgb) {
    var _this = rgb;
    var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    if (/^(rgb|RGB)/.test(_this)) {
        var aColor = _this.replace(/(?:(|)|rgb|RGB)*/g, "").split(",");
        var strHex = "#";
        for (var i = 0; i < aColor.length; i++) {
            var hex = Number(aColor[i]).toString(16);
            hex = hex < 10 ? 0 + '' + hex : hex;// 保证每个rgb的值为2位
            if (hex === "0") {
                hex += hex;
            }
            strHex += hex;
        }
        if (strHex.length !== 7) {
            strHex = _this;
        }
        return strHex;
    } else if (reg.test(_this)) {
        var aNum = _this.replace(/#/, "").split("");
        if (aNum.length === 6) {
            return _this;
        } else if (aNum.length === 3) {
            var numHex = "#";
            for (var i = 0; i < aNum.length; i += 1) {
                numHex += (aNum[i] + aNum[i]);
            }
            return numHex;
        }
    } else {
        return _this;
    }
}




//全选函数
function setAll() {
    var kn = document.getElementsByName("keynode");
    for (var i = 0; i < kn.length; i++) {
        kn[i].checked = true;
    }
}

//全不选函数
function setNo() {
    var kn = document.getElementsByName("keynode");
    for (var i = 0; i < kn.length; i++) {
        kn[i].checked = false;
    }
}

//反选
function setOthers() {
    var kn = document.getElementsByName("keynode");
    for (var i = 0; i < loves.length; i++) {
        if (kn[i].checked == false)
            kn[i].checked = true;
        else
            kn[i].checked = false;
    }
}

//全选/全不选操作
function setAllNo(){
    var box = document.getElementById("boxid");
    var kn = document.getElementsByName("keynode");
    if(box.checked == false){
        for (var i = 0; i < kn.length; i++) {
            kn[i].checked = false;
        }
    }else{
        for (var i = 0; i < kn.length; i++) {
            kn[i].checked = true;
        }
    }
}



// 动态改变下拉框hallmark内容
//var hallmarkArray = new Array();
//hallmarkArray[0] = new Array();
//hallmarkArray[1] = new Array();
//hallmarkArray[2] = new Array();
//hallmarkArray[3] = new Array();
//hallmarkArray[4] = new Array();
//hallmarkArray[5] = new Array();
//hallmarkArray[6] = new Array();
//hallmarkArray[7] = new Array();
//hallmarkArray[8] = new Array();
//hallmarkArray[9] = new Array();
//hallmarkArray[10] = new Array();
//hallmarkArray[11] = new Array();
//hallmarkArray[12] = new Array();
//hallmarkArray[13] = new Array();
//hallmarkArray[14] = new Array();
//hallmarkArray[15] = new Array();
//hallmarkArray[16] = new Array();
//hallmarkArray[17] = new Array();

function hallmarkChange() {
   var x = document.getElementById("gene");
   var y = document.getElementById("hallmark");
   y.options.length = 0; // 清除second下拉框的所有内容
   if(x.selectedIndex == 1) {
		y.options.add(new Option("------------------OPTION-----------------", "0", false, true));
		y.options.add(new Option("UV_RESPONSE_DN", "a"));
		y.options.add(new Option("MYOGENESIS", "b"));
		y.options.add(new Option("EPITHELIAL_MESENCHYMAL_TRANSITION", "c"));
		y.options.add(new Option("TNFA_SIGNALING_VIA_NFKB", "d"));
		y.options.add(new Option("APICAL_JUNCTION", "e"));
		y.options.add(new Option("INTERFERON_ALPHA_RESPONSE", "f"));
		y.options.add(new Option("MYC_TARGETS_V2", "g"));
		y.options.add(new Option("SPERMATOGENESIS", "h"));
		y.options.add(new Option("INTERFERON_GAMMA_RESPONSE", "i"));
		y.options.add(new Option("UNFOLDED_PROTEIN_RESPONSE", "j"));
		y.options.add(new Option("E2F_TARGETS", "k"));
		y.options.add(new Option("G2M_CHECKPOINT", "l"));
		y.options.add(new Option("MITOTIC_SPINDLE", "m"));
		y.options.add(new Option("MTORC1_SIGNALING", "n"));
		y.options.add(new Option("OXIDATIVE_PHOSPHORYLATION", "o"));
		y.options.add(new Option("GLYCOLYSIS", "p"));
		y.options.add(new Option("DNA_REPAIR", "q"));
		y.options.add(new Option("MYC_TARGETS_V1", "r"));
		y.options.add(new Option("HYPOXIA", "s"));
		y.options.add(new Option("UV_RESPONSE_UP", "t"));
		y.options.add(new Option("CHOLESTEROL_HOMEOSTASIS", "u"));
   }
   if(x.selectedIndex == 2) {
		y.options.add(new Option("------------------OPTION-----------------", "0", false, true));
		y.options.add(new Option("MYOGENESIS", "a"));
		y.options.add(new Option("TNFA_SIGNALING_VIA_NFKB", "b"));
		y.options.add(new Option("ADIPOGENESIS", "c"));
		y.options.add(new Option("UV_RESPONSE_DN", "d"));
		y.options.add(new Option("MYC_TARGETS_V2", "e"));
		y.options.add(new Option("INTERFERON_ALPHA_RESPONSE", "f"));
		y.options.add(new Option("PROTEIN_SECRETION", "g"));
		y.options.add(new Option("UNFOLDED_PROTEIN_RESPONSE", "h"));
		y.options.add(new Option("SPERMATOGENESIS", "i"));
		y.options.add(new Option("PI3K_AKT_MTOR_SIGNALING", "j"));
		y.options.add(new Option("DNA_REPAIR", "k"));
		y.options.add(new Option("G2M_CHECKPOINT", "l"));
		y.options.add(new Option("OXIDATIVE_PHOSPHORYLATION", "m"));
		y.options.add(new Option("GLYCOLYSIS", "n"));
		y.options.add(new Option("INTERFERON_GAMMA_RESPONSE", "o"));
		y.options.add(new Option("MITOTIC_SPINDLE", "p"));
		y.options.add(new Option("E2F_TARGETS", "q"));
		y.options.add(new Option("ESTROGEN_RESPONSE_LATE", "r"));
		y.options.add(new Option("MTORC1_SIGNALING", "s"));
		y.options.add(new Option("ESTROGEN_RESPONSE_EARLY", "t"));
		y.options.add(new Option("ALLOGRAFT_REJECTION", "u"));
		y.options.add(new Option("MYC_TARGETS_V1", "v"));
		y.options.add(new Option("HYPOXIA", "w"));
		y.options.add(new Option("UV_RESPONSE_UP", "x"));
		y.options.add(new Option("XENOBIOTIC_METABOLISM", "y"));
		y.options.add(new Option("PEROXISOME", "z"));
		y.options.add(new Option("KRAS_SIGNALING_UP", "aa"));
   }
   if(x.selectedIndex == 3) {
		y.options.add(new Option("------------------OPTION-----------------", "0", false, true));
		y.options.add(new Option("MYOGENESIS", "a"));
		y.options.add(new Option("MYC_TARGETS_V2", "b"));
		y.options.add(new Option("PROTEIN_SECRETION", "c"));
		y.options.add(new Option("INTERFERON_ALPHA_RESPONSE", "d"));
		y.options.add(new Option("UNFOLDED_PROTEIN_RESPONSE", "e"));
		y.options.add(new Option("UV_RESPONSE_UP", "f"));
		y.options.add(new Option("DNA_REPAIR", "g"));
		y.options.add(new Option("OXIDATIVE_PHOSPHORYLATION", "h"));
		y.options.add(new Option("G2M_CHECKPOINT", "i"));
		y.options.add(new Option("E2F_TARGETS", "j"));
		y.options.add(new Option("MTORC1_SIGNALING", "k"));
		y.options.add(new Option("P53_PATHWAY", "l"));
		y.options.add(new Option("ALLOGRAFT_REJECTION", "m"));
		y.options.add(new Option("GLYCOLYSIS", "n"));
		y.options.add(new Option("INTERFERON_GAMMA_RESPONSE", "o"));
		y.options.add(new Option("MITOTIC_SPINDLE", "p"));
		y.options.add(new Option("MYC_TARGETS_V1", "q"));
		y.options.add(new Option("KRAS_SIGNALING_DN", "r"));
		y.options.add(new Option("ESTROGEN_RESPONSE_LATE", "s"));
		y.options.add(new Option("CHOLESTEROL_HOMEOSTASIS", "t"));
		y.options.add(new Option("INFLAMMATORY_RESPONSE", "u"));
		y.options.add(new Option("UV_RESPONSE_DN", "v"));
		y.options.add(new Option("PI3K_AKT_MTOR_SIGNALING", "w"));
		y.options.add(new Option("APOPTOSIS", "x"));
		y.options.add(new Option("ESTROGEN_RESPONSE_EARLY", "y"));
		y.options.add(new Option("WNT_BETA_CATENIN_SIGNALING", "z"));
		y.options.add(new Option("ANDROGEN_RESPONSE", "aa"));
		y.options.add(new Option("PEROXISOME", "ab"));
		y.options.add(new Option("APICAL_JUNCTION", "ac"));
		y.options.add(new Option("REACTIVE_OXYGEN_SPECIES_PATHWAY", "ad"));
		y.options.add(new Option("FATTY_ACID_METABOLISM", "ae"));
		y.options.add(new Option("XENOBIOTIC_METABOLISM", "af"));
		y.options.add(new Option("KRAS_SIGNALING_UP", "ag"));
   }
   if(x.selectedIndex == 4) {
		y.options.add(new Option("------------------OPTION-----------------", "0", false, true));
		y.options.add(new Option("COMPLEMENT", "a"));
		y.options.add(new Option("EPITHELIAL_MESENCHYMAL_TRANSITION", "b"));
		y.options.add(new Option("G2M_CHECKPOINT", "c"));
		y.options.add(new Option("GLYCOLYSIS", "d"));
		y.options.add(new Option("INTERFERON_GAMMA_RESPONSE", "e"));
		y.options.add(new Option("MITOTIC_SPINDLE", "f"));
		y.options.add(new Option("TNFA_SIGNALING_VIA_NFKB", "g"));
		y.options.add(new Option("E2F_TARGETS", "h"));
		y.options.add(new Option("INFLAMMATORY_RESPONSE", "i"));
		y.options.add(new Option("ALLOGRAFT_REJECTION", "j"));
		y.options.add(new Option("KRAS_SIGNALING_UP", "k"));
		y.options.add(new Option("MYC_TARGETS_V1", "l"));
		y.options.add(new Option("UV_RESPONSE_DN", "m"));
		y.options.add(new Option("SPERMATOGENESIS", "n"));
		y.options.add(new Option("INTERFERON_ALPHA_RESPONSE", "o"));
		y.options.add(new Option("PROTEIN_SECRETION", "p"));
		y.options.add(new Option("IL6_JAK_STAT3_SIGNALING", "q"));
		y.options.add(new Option("MYC_TARGETS_V2", "r"));
		y.options.add(new Option("ANGIOGENESIS", "s"));
		y.options.add(new Option("MTORC1_SIGNALING", "t"));
		y.options.add(new Option("IL2_STAT5_SIGNALING", "u"));
		y.options.add(new Option("TGF_BETA_SIGNALING", "v"));
		y.options.add(new Option("HEDGEHOG_SIGNALING", "w"));
		y.options.add(new Option("FATTY_ACID_METABOLISM", "x"));
		y.options.add(new Option("COAGULATION", "y"));
		y.options.add(new Option("P53_PATHWAY", "z"));
		y.options.add(new Option("MYOGENESIS", "aa"));
		y.options.add(new Option("UNFOLDED_PROTEIN_RESPONSE", "ab"));
		y.options.add(new Option("ANDROGEN_RESPONSE", "ac"));
		y.options.add(new Option("UV_RESPONSE_UP", "ad"));
		y.options.add(new Option("ADIPOGENESIS", "ae"));
		y.options.add(new Option("APICAL_JUNCTION", "af"));
		y.options.add(new Option("OXIDATIVE_PHOSPHORYLATION", "ag"));
		y.options.add(new Option("APOPTOSIS", "ah"));
   }
   if(x.selectedIndex == 5) {
		y.options.add(new Option("------------------OPTION-----------------", "0", false, true));
		y.options.add(new Option("XENOBIOTIC_METABOLISM", "a"));
		y.options.add(new Option("EPITHELIAL_MESENCHYMAL_TRANSITION", "b"));
		y.options.add(new Option("TNFA_SIGNALING_VIA_NFKB", "c"));
		y.options.add(new Option("KRAS_SIGNALING_DN", "d"));
		y.options.add(new Option("COAGULATION", "e"));
		y.options.add(new Option("UNFOLDED_PROTEIN_RESPONSE", "f"));
		y.options.add(new Option("ANDROGEN_RESPONSE", "g"));
		y.options.add(new Option("CHOLESTEROL_HOMEOSTASIS", "h"));
		y.options.add(new Option("MYC_TARGETS_V2", "i"));
		y.options.add(new Option("PI3K_AKT_MTOR_SIGNALING", "j"));
		y.options.add(new Option("PROTEIN_SECRETION", "k"));
		y.options.add(new Option("DNA_REPAIR", "l"));
		y.options.add(new Option("MITOTIC_SPINDLE", "m"));
		y.options.add(new Option("ADIPOGENESIS", "n"));
		y.options.add(new Option("G2M_CHECKPOINT", "o"));
		y.options.add(new Option("MYC_TARGETS_V1", "p"));
		y.options.add(new Option("OXIDATIVE_PHOSPHORYLATION", "q"));
		y.options.add(new Option("E2F_TARGETS", "r"));
		y.options.add(new Option("MTORC1_SIGNALING", "s"));
		y.options.add(new Option("SPERMATOGENESIS", "t"));
		y.options.add(new Option("FATTY_ACID_METABOLISM", "u"));
		y.options.add(new Option("BILE_ACID_METABOLISM", "v"));
		y.options.add(new Option("GLYCOLYSIS", "w"));
		y.options.add(new Option("MYOGENESIS", "x"));
		y.options.add(new Option("KRAS_SIGNALING_UP", "y"));
   }
   if(x.selectedIndex == 6) {
		y.options.add(new Option("------------------OPTION-----------------", "0", false, true));
		y.options.add(new Option("G2M_CHECKPOINT", "a"));
		y.options.add(new Option("COMPLEMENT", "b"));
		y.options.add(new Option("HYPOXIA", "c"));
		y.options.add(new Option("INFLAMMATORY_RESPONSE", "d"));
		y.options.add(new Option("E2F_TARGETS", "e"));
		y.options.add(new Option("MTORC1_SIGNALING", "f"));
		y.options.add(new Option("EPITHELIAL_MESENCHYMAL_TRANSITION", "g"));
		y.options.add(new Option("GLYCOLYSIS", "h"));
		y.options.add(new Option("INTERFERON_GAMMA_RESPONSE", "i"));
		y.options.add(new Option("MITOTIC_SPINDLE", "j"));
		y.options.add(new Option("TNFA_SIGNALING_VIA_NFKB", "k"));
		y.options.add(new Option("ALLOGRAFT_REJECTION", "l"));
		y.options.add(new Option("IL2_STAT5_SIGNALING", "m"));
		y.options.add(new Option("KRAS_SIGNALING_UP", "n"));
		y.options.add(new Option("MYC_TARGETS_V1", "o"));
		y.options.add(new Option("P53_PATHWAY", "p"));
		y.options.add(new Option("COAGULATION", "q"));
		y.options.add(new Option("APOPTOSIS", "r"));
		y.options.add(new Option("UNFOLDED_PROTEIN_RESPONSE", "s"));
		y.options.add(new Option("INTERFERON_ALPHA_RESPONSE", "t"));
		y.options.add(new Option("IL6_JAK_STAT3_SIGNALING", "u"));
		y.options.add(new Option("OXIDATIVE_PHOSPHORYLATION", "v"));
		y.options.add(new Option("KRAS_SIGNALING_DN", "w"));
		y.options.add(new Option("FATTY_ACID_METABOLISM", "x"));
		y.options.add(new Option("XENOBIOTIC_METABOLISM", "y"));
		y.options.add(new Option("APICAL_JUNCTION", "z"));
		y.options.add(new Option("BILE_ACID_METABOLISM", "aa"));
		y.options.add(new Option("HEME_METABOLISM", "ab"));
		y.options.add(new Option("UV_RESPONSE_DN", "ac"));
		y.options.add(new Option("PI3K_AKT_MTOR_SIGNALING", "ad"));
		y.options.add(new Option("ANGIOGENESIS", "ae"));
		y.options.add(new Option("PEROXISOME", "af"));
		y.options.add(new Option("MYC_TARGETS_V2", "ag"));
		y.options.add(new Option("ADIPOGENESIS", "ah"));
		y.options.add(new Option("ESTROGEN_RESPONSE_LATE", "ai"));
		y.options.add(new Option("WNT_BETA_CATENIN_SIGNALING", "aj"));
		y.options.add(new Option("HEDGEHOG_SIGNALING", "ak"));
		y.options.add(new Option("ESTROGEN_RESPONSE_EARLY", "al"));
   }
   if(x.selectedIndex == 7) {
		y.options.add(new Option("------------------OPTION-----------------", "0", false, true));
		y.options.add(new Option("P53_PATHWAY", "a"));
		y.options.add(new Option("G2M_CHECKPOINT", "b"));
		y.options.add(new Option("MYC_TARGETS_V1", "c"));
		y.options.add(new Option("DNA_REPAIR", "d"));
		y.options.add(new Option("ALLOGRAFT_REJECTION", "e"));
		y.options.add(new Option("E2F_TARGETS", "f"));
		y.options.add(new Option("MTORC1_SIGNALING", "g"));
		y.options.add(new Option("COMPLEMENT", "h"));
		y.options.add(new Option("GLYCOLYSIS", "i"));
		y.options.add(new Option("INFLAMMATORY_RESPONSE", "j"));
		y.options.add(new Option("INTERFERON_GAMMA_RESPONSE", "k"));
		y.options.add(new Option("MITOTIC_SPINDLE", "l"));
		y.options.add(new Option("INTERFERON_ALPHA_RESPONSE", "m"));
		y.options.add(new Option("MYC_TARGETS_V2", "n"));
		y.options.add(new Option("MYOGENESIS", "o"));
		y.options.add(new Option("KRAS_SIGNALING_DN", "p"));
		y.options.add(new Option("APOPTOSIS", "q"));
		y.options.add(new Option("UNFOLDED_PROTEIN_RESPONSE", "r"));
		y.options.add(new Option("PI3K_AKT_MTOR_SIGNALING", "s"));
		y.options.add(new Option("FATTY_ACID_METABOLISM", "t"));
		y.options.add(new Option("XENOBIOTIC_METABOLISM", "u"));
		y.options.add(new Option("EPITHELIAL_MESENCHYMAL_TRANSITION", "v"));
		y.options.add(new Option("IL6_JAK_STAT3_SIGNALING", "w"));
		y.options.add(new Option("PROTEIN_SECRETION", "x"));
		y.options.add(new Option("BILE_ACID_METABOLISM", "y"));
		y.options.add(new Option("APICAL_JUNCTION", "z"));
   }
   if(x.selectedIndex == 8) {
		y.options.add(new Option("------------------OPTION-----------------", "0", false, true));
		y.options.add(new Option("EPITHELIAL_MESENCHYMAL_TRANSITION", "a"));
		y.options.add(new Option("GLYCOLYSIS", "b"));
		y.options.add(new Option("MITOTIC_SPINDLE", "c"));
		y.options.add(new Option("OXIDATIVE_PHOSPHORYLATION", "d"));
		y.options.add(new Option("E2F_TARGETS", "e"));
		y.options.add(new Option("G2M_CHECKPOINT", "f"));
		y.options.add(new Option("MTORC1_SIGNALING", "g"));
		y.options.add(new Option("DNA_REPAIR", "h"));
		y.options.add(new Option("SPERMATOGENESIS", "i"));
		y.options.add(new Option("UV_RESPONSE_UP", "j"));
		y.options.add(new Option("APICAL_JUNCTION", "k"));
		y.options.add(new Option("MYC_TARGETS_V1", "l"));
		y.options.add(new Option("MYC_TARGETS_V2", "m"));
		y.options.add(new Option("PROTEIN_SECRETION", "n"));
		y.options.add(new Option("TNFA_SIGNALING_VIA_NFKB", "o"));
		y.options.add(new Option("UNFOLDED_PROTEIN_RESPONSE", "p"));
		y.options.add(new Option("ESTROGEN_RESPONSE_LATE", "q"));
		y.options.add(new Option("WNT_BETA_CATENIN_SIGNALING", "r"));
		y.options.add(new Option("PI3K_AKT_MTOR_SIGNALING", "s"));
		y.options.add(new Option("P53_PATHWAY", "t"));
		y.options.add(new Option("APOPTOSIS", "u"));
		y.options.add(new Option("ANGIOGENESIS", "v"));
   }
   if(x.selectedIndex == 9) {
		y.options.add(new Option("------------------OPTION-----------------", "0", false, true));
		y.options.add(new Option("E2F_TARGETS", "a"));
		y.options.add(new Option("MTORC1_SIGNALING", "b"));
		y.options.add(new Option("ESTROGEN_RESPONSE_LATE", "c"));
		y.options.add(new Option("OXIDATIVE_PHOSPHORYLATION", "d"));
		y.options.add(new Option("GLYCOLYSIS", "e"));
		y.options.add(new Option("ESTROGEN_RESPONSE_EARLY", "f"));
		y.options.add(new Option("MYC_TARGETS_V1", "g"));
		y.options.add(new Option("G2M_CHECKPOINT", "h"));
		y.options.add(new Option("FATTY_ACID_METABOLISM", "i"));
		y.options.add(new Option("DNA_REPAIR", "j"));
		y.options.add(new Option("SPERMATOGENESIS", "k"));
		y.options.add(new Option("UNFOLDED_PROTEIN_RESPONSE", "l"));
		y.options.add(new Option("PEROXISOME", "m"));
		y.options.add(new Option("PROTEIN_SECRETION", "n"));
		y.options.add(new Option("MYC_TARGETS_V2", "o"));
		y.options.add(new Option("MITOTIC_SPINDLE", "p"));
		y.options.add(new Option("XENOBIOTIC_METABOLISM", "q"));
		y.options.add(new Option("INFLAMMATORY_RESPONSE", "r"));
		y.options.add(new Option("MYOGENESIS", "s"));
		y.options.add(new Option("TNFA_SIGNALING_VIA_NFKB", "t"));
		y.options.add(new Option("ADIPOGENESIS", "u"));
		y.options.add(new Option("IL6_JAK_STAT3_SIGNALING", "v"));
		y.options.add(new Option("UV_RESPONSE_DN", "w"));
		y.options.add(new Option("UV_RESPONSE_UP", "x"));
		y.options.add(new Option("APICAL_JUNCTION", "y"));
		y.options.add(new Option("EPITHELIAL_MESENCHYMAL_TRANSITION", "z"));
		y.options.add(new Option("PI3K_AKT_MTOR_SIGNALING", "aa"));
		y.options.add(new Option("COMPLEMENT", "ab"));
		y.options.add(new Option("TGF_BETA_SIGNALING", "ac"));
		y.options.add(new Option("HEME_METABOLISM", "ad"));
   }
   if(x.selectedIndex == 10) {
		y.options.add(new Option("------------------OPTION-----------------", "0", false, true));
		y.options.add(new Option("E2F_TARGETS", "a"));
		y.options.add(new Option("MTORC1_SIGNALING", "b"));
		y.options.add(new Option("ESTROGEN_RESPONSE_LATE", "c"));
		y.options.add(new Option("GLYCOLYSIS", "d"));
		y.options.add(new Option("MITOTIC_SPINDLE", "e"));
		y.options.add(new Option("G2M_CHECKPOINT", "f"));
		y.options.add(new Option("MYC_TARGETS_V1", "g"));
		y.options.add(new Option("OXIDATIVE_PHOSPHORYLATION", "h"));
		y.options.add(new Option("DNA_REPAIR", "i"));
		y.options.add(new Option("SPERMATOGENESIS", "j"));
		y.options.add(new Option("PROTEIN_SECRETION", "k"));
		y.options.add(new Option("PI3K_AKT_MTOR_SIGNALING", "l"));
		y.options.add(new Option("UNFOLDED_PROTEIN_RESPONSE", "m"));
		y.options.add(new Option("MYC_TARGETS_V2", "n"));
		y.options.add(new Option("UV_RESPONSE_UP", "o"));
		y.options.add(new Option("PEROXISOME", "p"));
		y.options.add(new Option("P53_PATHWAY", "q"));
		y.options.add(new Option("INFLAMMATORY_RESPONSE", "r"));
		y.options.add(new Option("MYOGENESIS", "s"));
		y.options.add(new Option("TNFA_SIGNALING_VIA_NFKB", "t"));
		y.options.add(new Option("IL6_JAK_STAT3_SIGNALING", "u"));
		y.options.add(new Option("ESTROGEN_RESPONSE_EARLY", "v"));
		y.options.add(new Option("KRAS_SIGNALING_DN", "w"));
		y.options.add(new Option("FATTY_ACID_METABOLISM", "x"));
		y.options.add(new Option("HYPOXIA", "y"));
		y.options.add(new Option("COMPLEMENT", "z"));
		y.options.add(new Option("XENOBIOTIC_METABOLISM", "aa"));
		y.options.add(new Option("COAGULATION", "ab"));
		y.options.add(new Option("UV_RESPONSE_DN", "ac"));
   }
   if(x.selectedIndex == 11) {
		y.options.add(new Option("------------------OPTION-----------------", "0", false, true));
		y.options.add(new Option("ESTROGEN_RESPONSE_EARLY", "a"));
		y.options.add(new Option("INFLAMMATORY_RESPONSE", "b"));
		y.options.add(new Option("E2F_TARGETS", "c"));
		y.options.add(new Option("EPITHELIAL_MESENCHYMAL_TRANSITION", "d"));
		y.options.add(new Option("ESTROGEN_RESPONSE_LATE", "e"));
		y.options.add(new Option("GLYCOLYSIS", "f"));
		y.options.add(new Option("INTERFERON_GAMMA_RESPONSE", "g"));
		y.options.add(new Option("MITOTIC_SPINDLE", "h"));
		y.options.add(new Option("MTORC1_SIGNALING", "i"));
		y.options.add(new Option("TNFA_SIGNALING_VIA_NFKB", "j"));
		y.options.add(new Option("XENOBIOTIC_METABOLISM", "k"));
		y.options.add(new Option("COMPLEMENT", "l"));
		y.options.add(new Option("P53_PATHWAY", "m"));
		y.options.add(new Option("ALLOGRAFT_REJECTION", "n"));
		y.options.add(new Option("APICAL_JUNCTION", "o"));
		y.options.add(new Option("IL2_STAT5_SIGNALING", "p"));
		y.options.add(new Option("KRAS_SIGNALING_UP", "q"));
		y.options.add(new Option("MYC_TARGETS_V1", "r"));
		y.options.add(new Option("ADIPOGENESIS", "s"));
		y.options.add(new Option("OXIDATIVE_PHOSPHORYLATION", "t"));
		y.options.add(new Option("HYPOXIA", "u"));
		y.options.add(new Option("G2M_CHECKPOINT", "v"));
		y.options.add(new Option("APOPTOSIS", "w"));
		y.options.add(new Option("UV_RESPONSE_UP", "x"));
		y.options.add(new Option("COAGULATION", "y"));
		y.options.add(new Option("UV_RESPONSE_DN", "z"));
		y.options.add(new Option("PI3K_AKT_MTOR_SIGNALING", "aa"));
		y.options.add(new Option("ANDROGEN_RESPONSE", "ab"));
		y.options.add(new Option("IL6_JAK_STAT3_SIGNALING", "ac"));
		y.options.add(new Option("INTERFERON_ALPHA_RESPONSE", "ad"));
		y.options.add(new Option("CHOLESTEROL_HOMEOSTASIS", "ae"));
		y.options.add(new Option("TGF_BETA_SIGNALING", "af"));
		y.options.add(new Option("REACTIVE_OXYGEN_SPECIES_PATHWAY", "ag"));
		y.options.add(new Option("APICAL_SURFACE", "ah"));
		y.options.add(new Option("ANGIOGENESIS", "ai"));
		y.options.add(new Option("HEDGEHOG_SIGNALING", "aj"));
		y.options.add(new Option("MYOGENESIS", "ak"));
		y.options.add(new Option("DNA_REPAIR", "al"));
		y.options.add(new Option("PROTEIN_SECRETION", "am"));
		y.options.add(new Option("NOTCH_SIGNALING", "an"));
		y.options.add(new Option("PEROXISOME", "ao"));
		y.options.add(new Option("HEME_METABOLISM", "ap"));
   }
   if(x.selectedIndex == 12) {
		y.options.add(new Option("------------------OPTION-----------------", "0", false, true));
		y.options.add(new Option("APICAL_JUNCTION", "a"));
		y.options.add(new Option("MYOGENESIS", "b"));
		y.options.add(new Option("EPITHELIAL_MESENCHYMAL_TRANSITION", "c"));
		y.options.add(new Option("MYC_TARGETS_V2", "d"));
		y.options.add(new Option("CHOLESTEROL_HOMEOSTASIS", "e"));
		y.options.add(new Option("PROTEIN_SECRETION", "f"));
		y.options.add(new Option("ANDROGEN_RESPONSE", "g"));
		y.options.add(new Option("PEROXISOME", "h"));
		y.options.add(new Option("PI3K_AKT_MTOR_SIGNALING", "i"));
		y.options.add(new Option("UNFOLDED_PROTEIN_RESPONSE", "j"));
		y.options.add(new Option("BILE_ACID_METABOLISM", "k"));
		y.options.add(new Option("DNA_REPAIR", "l"));
		y.options.add(new Option("GLYCOLYSIS", "m"));
		y.options.add(new Option("UV_RESPONSE_DN", "n"));
		y.options.add(new Option("XENOBIOTIC_METABOLISM", "o"));
		y.options.add(new Option("UV_RESPONSE_UP", "p"));
		y.options.add(new Option("FATTY_ACID_METABOLISM", "q"));
		y.options.add(new Option("E2F_TARGETS", "r"));
		y.options.add(new Option("MTORC1_SIGNALING", "s"));
		y.options.add(new Option("MYC_TARGETS_V1", "t"));
		y.options.add(new Option("ADIPOGENESIS", "u"));
		y.options.add(new Option("G2M_CHECKPOINT", "v"));
		y.options.add(new Option("OXIDATIVE_PHOSPHORYLATION", "w"));
		y.options.add(new Option("KRAS_SIGNALING_DN", "x"));
		y.options.add(new Option("MITOTIC_SPINDLE", "y"));
		y.options.add(new Option("ESTROGEN_RESPONSE_LATE", "z"));
		y.options.add(new Option("REACTIVE_OXYGEN_SPECIES_PATHWAY", "aa"));
		y.options.add(new Option("HEME_METABOLISM", "ab"));
   }
   if(x.selectedIndex == 13) {
		y.options.add(new Option("------------------OPTION-----------------", "0", false, true));
		y.options.add(new Option("MYOGENESIS", "a"));
		y.options.add(new Option("KRAS_SIGNALING_DN", "b"));
		y.options.add(new Option("WNT_BETA_CATENIN_SIGNALING", "c"));
		y.options.add(new Option("MYC_TARGETS_V2", "d"));
		y.options.add(new Option("CHOLESTEROL_HOMEOSTASIS", "e"));
		y.options.add(new Option("PROTEIN_SECRETION", "f"));
		y.options.add(new Option("INTERFERON_ALPHA_RESPONSE", "g"));
		y.options.add(new Option("UNFOLDED_PROTEIN_RESPONSE", "h"));
		y.options.add(new Option("DNA_REPAIR", "i"));
		y.options.add(new Option("UV_RESPONSE_UP", "j"));
		y.options.add(new Option("OXIDATIVE_PHOSPHORYLATION", "k"));
		y.options.add(new Option("G2M_CHECKPOINT", "l"));
		y.options.add(new Option("INTERFERON_GAMMA_RESPONSE", "m"));
		y.options.add(new Option("MITOTIC_SPINDLE", "n"));
		y.options.add(new Option("MYC_TARGETS_V1", "o"));
		y.options.add(new Option("ALLOGRAFT_REJECTION", "p"));
		y.options.add(new Option("ESTROGEN_RESPONSE_LATE", "q"));
		y.options.add(new Option("GLYCOLYSIS", "r"));
		y.options.add(new Option("P53_PATHWAY", "s"));
		y.options.add(new Option("E2F_TARGETS", "t"));
		y.options.add(new Option("MTORC1_SIGNALING", "u"));
		y.options.add(new Option("PI3K_AKT_MTOR_SIGNALING", "v"));
		y.options.add(new Option("APOPTOSIS", "w"));
		y.options.add(new Option("ANDROGEN_RESPONSE", "x"));
		y.options.add(new Option("PEROXISOME", "y"));
		y.options.add(new Option("INFLAMMATORY_RESPONSE", "z"));
		y.options.add(new Option("COAGULATION", "aa"));
		y.options.add(new Option("KRAS_SIGNALING_UP", "ab"));
		y.options.add(new Option("FATTY_ACID_METABOLISM", "ac"));
		y.options.add(new Option("SPERMATOGENESIS", "ad"));
		y.options.add(new Option("ESTROGEN_RESPONSE_EARLY", "ae"));
   }
   if(x.selectedIndex == 14) {
		y.options.add(new Option("------------------OPTION-----------------", "0", false, true));
		y.options.add(new Option("MYC_TARGETS_V2", "a"));
		y.options.add(new Option("MYOGENESIS", "b"));
		y.options.add(new Option("INTERFERON_ALPHA_RESPONSE", "c"));
		y.options.add(new Option("PROTEIN_SECRETION", "d"));
		y.options.add(new Option("UNFOLDED_PROTEIN_RESPONSE", "e"));
		y.options.add(new Option("COAGULATION", "f"));
		y.options.add(new Option("DNA_REPAIR", "g"));
		y.options.add(new Option("UV_RESPONSE_UP", "h"));
		y.options.add(new Option("APOPTOSIS", "i"));
		y.options.add(new Option("ALLOGRAFT_REJECTION", "j"));
		y.options.add(new Option("MYC_TARGETS_V1", "k"));
		y.options.add(new Option("G2M_CHECKPOINT", "l"));
		y.options.add(new Option("OXIDATIVE_PHOSPHORYLATION", "m"));
		y.options.add(new Option("EPITHELIAL_MESENCHYMAL_TRANSITION", "n"));
		y.options.add(new Option("GLYCOLYSIS", "o"));
		y.options.add(new Option("INTERFERON_GAMMA_RESPONSE", "p"));
		y.options.add(new Option("MITOTIC_SPINDLE", "q"));
		y.options.add(new Option("E2F_TARGETS", "r"));
		y.options.add(new Option("MTORC1_SIGNALING", "s"));
		y.options.add(new Option("COMPLEMENT", "t"));
		y.options.add(new Option("KRAS_SIGNALING_DN", "u"));
		y.options.add(new Option("REACTIVE_OXYGEN_SPECIES_PATHWAY", "v"));
		y.options.add(new Option("ESTROGEN_RESPONSE_EARLY", "w"));
		y.options.add(new Option("IL6_JAK_STAT3_SIGNALING", "x"));
		y.options.add(new Option("PI3K_AKT_MTOR_SIGNALING", "y"));
		y.options.add(new Option("ESTROGEN_RESPONSE_LATE", "z"));
		y.options.add(new Option("IL2_STAT5_SIGNALING", "aa"));
		y.options.add(new Option("ADIPOGENESIS", "ab"));
		y.options.add(new Option("INFLAMMATORY_RESPONSE", "ac"));
		y.options.add(new Option("KRAS_SIGNALING_UP", "ad"));
		y.options.add(new Option("SPERMATOGENESIS", "ae"));
		y.options.add(new Option("TNFA_SIGNALING_VIA_NFKB", "af"));
		y.options.add(new Option("FATTY_ACID_METABOLISM", "ag"));
		y.options.add(new Option("P53_PATHWAY", "ah"));
   }
   if(x.selectedIndex == 15) {
		y.options.add(new Option("------------------OPTION-----------------", "0", false, true));
		y.options.add(new Option("ALLOGRAFT_REJECTION", "a"));
		y.options.add(new Option("IL2_STAT5_SIGNALING", "b"));
		y.options.add(new Option("INFLAMMATORY_RESPONSE", "c"));
		y.options.add(new Option("MYC_TARGETS_V1", "d"));
		y.options.add(new Option("DNA_REPAIR", "e"));
		y.options.add(new Option("E2F_TARGETS", "f"));
		y.options.add(new Option("KRAS_SIGNALING_UP", "g"));
		y.options.add(new Option("MTORC1_SIGNALING", "h"));
		y.options.add(new Option("COMPLEMENT", "i"));
		y.options.add(new Option("EPITHELIAL_MESENCHYMAL_TRANSITION", "j"));
		y.options.add(new Option("GLYCOLYSIS", "k"));
		y.options.add(new Option("INTERFERON_GAMMA_RESPONSE", "l"));
		y.options.add(new Option("MITOTIC_SPINDLE", "m"));
		y.options.add(new Option("G2M_CHECKPOINT", "n"));
		y.options.add(new Option("SPERMATOGENESIS", "o"));
		y.options.add(new Option("IL6_JAK_STAT3_SIGNALING", "p"));
		y.options.add(new Option("PROTEIN_SECRETION", "q"));
		y.options.add(new Option("INTERFERON_ALPHA_RESPONSE", "r"));
		y.options.add(new Option("MYC_TARGETS_V2", "s"));
		y.options.add(new Option("MYOGENESIS", "t"));
		y.options.add(new Option("FATTY_ACID_METABOLISM", "u"));
		y.options.add(new Option("UNFOLDED_PROTEIN_RESPONSE", "v"));
		y.options.add(new Option("ANGIOGENESIS", "w"));
		y.options.add(new Option("APOPTOSIS", "x"));
		y.options.add(new Option("PI3K_AKT_MTOR_SIGNALING", "y"));
		y.options.add(new Option("TNFA_SIGNALING_VIA_NFKB", "z"));
		y.options.add(new Option("NOTCH_SIGNALING", "aa"));
		y.options.add(new Option("COAGULATION", "ab"));
		y.options.add(new Option("XENOBIOTIC_METABOLISM", "ac"));
		y.options.add(new Option("KRAS_SIGNALING_DN", "ad"));
		y.options.add(new Option("ADIPOGENESIS", "ae"));
		y.options.add(new Option("HEME_METABOLISM", "af"));
		y.options.add(new Option("UV_RESPONSE_UP", "ag"));
		y.options.add(new Option("ESTROGEN_RESPONSE_LATE", "ah"));
		y.options.add(new Option("HYPOXIA", "ai"));
		y.options.add(new Option("BILE_ACID_METABOLISM", "aj"));
   }
   if(x.selectedIndex == 16) {
		y.options.add(new Option("------------------OPTION-----------------", "0", false, true));
		y.options.add(new Option("MYC_TARGETS_V2", "a"));
		y.options.add(new Option("TGF_BETA_SIGNALING", "b"));
		y.options.add(new Option("CHOLESTEROL_HOMEOSTASIS", "c"));
		y.options.add(new Option("IL6_JAK_STAT3_SIGNALING", "d"));
		y.options.add(new Option("PROTEIN_SECRETION", "e"));
		y.options.add(new Option("INTERFERON_ALPHA_RESPONSE", "f"));
		y.options.add(new Option("ANDROGEN_RESPONSE", "g"));
		y.options.add(new Option("PEROXISOME", "h"));
		y.options.add(new Option("UNFOLDED_PROTEIN_RESPONSE", "i"));
		y.options.add(new Option("PI3K_AKT_MTOR_SIGNALING", "j"));
		y.options.add(new Option("DNA_REPAIR", "k"));
		y.options.add(new Option("COAGULATION", "l"));
		y.options.add(new Option("UV_RESPONSE_UP", "m"));
		y.options.add(new Option("FATTY_ACID_METABOLISM", "n"));
		y.options.add(new Option("OXIDATIVE_PHOSPHORYLATION", "o"));
		y.options.add(new Option("APOPTOSIS", "p"));
		y.options.add(new Option("G2M_CHECKPOINT", "q"));
		y.options.add(new Option("HEME_METABOLISM", "r"));
		y.options.add(new Option("P53_PATHWAY", "s"));
		y.options.add(new Option("ALLOGRAFT_REJECTION", "t"));
		y.options.add(new Option("APICAL_JUNCTION", "u"));
		y.options.add(new Option("IL2_STAT5_SIGNALING", "v"));
		y.options.add(new Option("MYC_TARGETS_V1", "w"));
		y.options.add(new Option("ADIPOGENESIS", "x"));
		y.options.add(new Option("ESTROGEN_RESPONSE_EARLY", "y"));
		y.options.add(new Option("COMPLEMENT", "z"));
		y.options.add(new Option("E2F_TARGETS", "aa"));
		y.options.add(new Option("KRAS_SIGNALING_UP", "ab"));
		y.options.add(new Option("MTORC1_SIGNALING", "ac"));
		y.options.add(new Option("INFLAMMATORY_RESPONSE", "ad"));
		y.options.add(new Option("EPITHELIAL_MESENCHYMAL_TRANSITION", "ae"));
		y.options.add(new Option("GLYCOLYSIS", "af"));
		y.options.add(new Option("INTERFERON_GAMMA_RESPONSE", "ag"));
		y.options.add(new Option("MITOTIC_SPINDLE", "ah"));
		y.options.add(new Option("TNFA_SIGNALING_VIA_NFKB", "ai"));
		y.options.add(new Option("XENOBIOTIC_METABOLISM", "aj"));
		y.options.add(new Option("ESTROGEN_RESPONSE_LATE", "ak"));
		y.options.add(new Option("HYPOXIA", "al"));
		y.options.add(new Option("REACTIVE_OXYGEN_SPECIES_PATHWAY", "am"));
		y.options.add(new Option("NOTCH_SIGNALING", "an"));
		y.options.add(new Option("MYOGENESIS", "ao"));
		y.options.add(new Option("BILE_ACID_METABOLISM", "ap"));
   }
   if(x.selectedIndex == 17) {
		y.options.add(new Option("------------------OPTION-----------------", "0", false, true));
		y.options.add(new Option("G2M_CHECKPOINT", "a"));
		y.options.add(new Option("E2F_TARGETS", "b"));
		y.options.add(new Option("MYC_TARGETS_V1", "c"));
		y.options.add(new Option("EPITHELIAL_MESENCHYMAL_TRANSITION", "d"));
		y.options.add(new Option("OXIDATIVE_PHOSPHORYLATION", "e"));
		y.options.add(new Option("ESTROGEN_RESPONSE_LATE", "f"));
		y.options.add(new Option("DNA_REPAIR", "g"));
		y.options.add(new Option("MYC_TARGETS_V2", "h"));
		y.options.add(new Option("REACTIVE_OXYGEN_SPECIES_PATHWAY", "i"));
		y.options.add(new Option("INTERFERON_ALPHA_RESPONSE", "j"));
		y.options.add(new Option("PI3K_AKT_MTOR_SIGNALING", "k"));
		y.options.add(new Option("APOPTOSIS", "l"));
		y.options.add(new Option("IL6_JAK_STAT3_SIGNALING", "m"));
		y.options.add(new Option("UV_RESPONSE_UP", "n"));
		y.options.add(new Option("COMPLEMENT", "o"));
		y.options.add(new Option("INTERFERON_GAMMA_RESPONSE", "p"));
		y.options.add(new Option("TNFA_SIGNALING_VIA_NFKB", "q"));
		y.options.add(new Option("ALLOGRAFT_REJECTION", "r"));
		y.options.add(new Option("IL2_STAT5_SIGNALING", "s"));
		y.options.add(new Option("XENOBIOTIC_METABOLISM", "t"));
		y.options.add(new Option("INFLAMMATORY_RESPONSE", "u"));
		y.options.add(new Option("HYPOXIA", "v"));
		y.options.add(new Option("HEME_METABOLISM", "w"));
		y.options.add(new Option("KRAS_SIGNALING_UP", "x"));
		y.options.add(new Option("UV_RESPONSE_DN", "y"));
		y.options.add(new Option("ESTROGEN_RESPONSE_EARLY", "z"));
		y.options.add(new Option("MYOGENESIS", "aa"));
		y.options.add(new Option("COAGULATION", "ab"));
		y.options.add(new Option("SPERMATOGENESIS", "ac"));
		y.options.add(new Option("MTORC1_SIGNALING", "ad"));
		y.options.add(new Option("APICAL_JUNCTION", "ae"));
		y.options.add(new Option("HEDGEHOG_SIGNALING", "af"));
   }
   if(x.selectedIndex == 18) {
		y.options.add(new Option("------------------OPTION-----------------", "0", false, true));
		y.options.add(new Option("ESTROGEN_RESPONSE_LATE", "a"));
		y.options.add(new Option("GLYCOLYSIS", "b"));
		y.options.add(new Option("INFLAMMATORY_RESPONSE", "c"));
		y.options.add(new Option("INTERFERON_GAMMA_RESPONSE", "d"));
		y.options.add(new Option("MITOTIC_SPINDLE", "e"));
		y.options.add(new Option("XENOBIOTIC_METABOLISM", "f"));
		y.options.add(new Option("ALLOGRAFT_REJECTION", "g"));
		y.options.add(new Option("MYC_TARGETS_V1", "h"));
		y.options.add(new Option("ADIPOGENESIS", "i"));
		y.options.add(new Option("ESTROGEN_RESPONSE_EARLY", "j"));
		y.options.add(new Option("G2M_CHECKPOINT", "k"));
		y.options.add(new Option("P53_PATHWAY", "l"));
		y.options.add(new Option("E2F_TARGETS", "m"));
		y.options.add(new Option("MTORC1_SIGNALING", "n"));
		y.options.add(new Option("UV_RESPONSE_UP", "o"));
		y.options.add(new Option("OXIDATIVE_PHOSPHORYLATION", "p"));
		y.options.add(new Option("DNA_REPAIR", "q"));
		y.options.add(new Option("FATTY_ACID_METABOLISM", "r"));
		y.options.add(new Option("PEROXISOME", "s"));
		y.options.add(new Option("PI3K_AKT_MTOR_SIGNALING", "t"));
		y.options.add(new Option("UNFOLDED_PROTEIN_RESPONSE", "u"));
		y.options.add(new Option("INTERFERON_ALPHA_RESPONSE", "v"));
		y.options.add(new Option("SPERMATOGENESIS", "w"));
		y.options.add(new Option("CHOLESTEROL_HOMEOSTASIS", "x"));
		y.options.add(new Option("REACTIVE_OXYGEN_SPECIES_PATHWAY", "y"));
		y.options.add(new Option("MYC_TARGETS_V2", "z"));
		y.options.add(new Option("UV_RESPONSE_DN", "aa"));
		y.options.add(new Option("MYOGENESIS", "ab"));
		y.options.add(new Option("APICAL_JUNCTION", "ac"));
		y.options.add(new Option("EPITHELIAL_MESENCHYMAL_TRANSITION", "ad"));
		y.options.add(new Option("APOPTOSIS", "ae"));
		y.options.add(new Option("ANDROGEN_RESPONSE", "af"));
		y.options.add(new Option("PROTEIN_SECRETION", "ag"));
		y.options.add(new Option("IL2_STAT5_SIGNALING", "ah"));
		y.options.add(new Option("COMPLEMENT", "ai"));
		y.options.add(new Option("KRAS_SIGNALING_DN", "aj"));
   }


}

