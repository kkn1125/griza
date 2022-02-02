/**!
 * griza v0.1.0 (https://github.com/kkn1125/griza)
 * Copyright 2021 Authors (https://github.com/kkn1125/griza/graphs/contributors) kkn1125
 * Licensed under MIT (https://github.com/kkn1125/griza/blob/main/LICENSE)
 */

'use strict';

const Griza = (function () {
    function Controller() {
        let moduleModel = null;
        let uiElem = null;
        let activatedTools = [];
        let currentTool = null;
        let selecting = null;
        let selected = null;

        this.init = function (model, ui) {
            moduleModel = model;
            uiElem = ui;

            uiElem.toolGroup.forEach(tool => {
                tool.addEventListener('mousedown', this.toolsModeHandler.bind(this));
                tool.addEventListener('click', this.toolsActivateHandler.bind(this));
            });
            uiElem.grizaPannel.addEventListener('mousedown', this.startDrawing);
            window.addEventListener('click', this.selectActivated);
            window.addEventListener('click', this.removeLayer);
            window.addEventListener('mouseup', this.resetDrawing);
            window.addEventListener('mousemove', this.moveHandler);
            window.addEventListener('mouseover', this.selectPathHandler.bind(this));
            this.renderLayerBox();
        }

        this.toolsActivateHandler = function (ev) {
            let target = ev.target;
            if (target.className == 'on') {
                this.currentAtivatedTool(target);
            } else if (target.className == 'off') {
                this.disableBeforeTool(target);
            }
        }

        this.currentAtivatedTool = function (tool) {
            activatedTools.push(tool.id);
            this.changeCurrentTool();
        }

        this.changeCurrentTool = function(){
            currentTool = activatedTools[activatedTools.length-1];
        }

        this.disableBeforeTool = function(tool){
            activatedTools = activatedTools.filter(active=>active!=tool.id);
            this.changeCurrentTool();
        }

        this.startDrawing = function (ev) {
            if (uiElem.pen.className == 'on' && activatedTools.indexOf('pen')>-1) moduleModel.startDrawing(ev, uiElem, 'pen');
        }

        this.resetDrawing = function () {
            if (uiElem.pen.className == 'on' && activatedTools.indexOf('pen')>-1) moduleModel.resetDrawing();
        }

        this.moveHandler = function (ev) {
            if (uiElem.pen.className == 'on' && activatedTools.indexOf('pen')>-1)
                moduleModel.moveHandler(ev, uiElem);
        }

        this.removeLayer = function(ev){
            let target = ev.target;
            if(target.getAttribute('griza-btn')!=='del')return;
            moduleModel.removeLayer(target, uiElem);
        }

        this.toolsModeHandler = function (ev) {
            moduleModel.toolsModeHandler(ev);
        }

        // select tool
        this.selectPathHandler = function(ev){
            let target = ev.target;

            if(target!==selecting) this.selectReset();

            if(!target || target.tagName !== 'path') return;
            if (currentTool && currentTool == 'pointer' && activatedTools.indexOf('pointer')>-1) {
                moduleModel.selectAcivating(target);
                selecting = document.getElementById('selecting');
            }
        }

        this.selectReset = function(ev){
            if(selecting){
                let target = document.querySelector('[griza-process="selecting"]');
                selecting.remove();
                selecting = null;
                if(target)
                moduleModel.selectDeactivating(target);
                console.log('reset select')
            }
        }

        this.selectActivated = function(ev){
            let target = ev.target;

            let deactive = document.querySelector('[griza-process="selected"]');
            if(deactive) {
                deactive.removeAttribute('griza-process');
                moduleModel.selectResetHandler();
            }
            if(target.id!=='selecting') return;
            
            moduleModel.selectActivated();
        }

        // render
        this.renderLayerBox = function(){
            moduleModel.renderLayerBox();
        }
    }

    function Model() {
        let moduleView = null;
        let grizaData = [];
        let drawMode = false;
        let path = null;
        let drawPath = '';
        let grizaIdx = 0;
        let selectedIdx = 0;
        let boundary = null;

        this.init = function (view) {
            moduleView = view;
        }

        // pen tool setting start
        this.createPath = function (type) {
            grizaData.push({
                name: `Layer ${grizaIdx<10?'0'+grizaIdx:grizaIdx}`,
                id: `gz-${grizaIdx}`,
                style: {
                    stroke: 'rgb(167, 205, 61)',
                    'stroke-width': '1px',
                    fill: 'transparent',
                },
                order: grizaIdx,
                path: '',
                type: type,
            });
            selectedIdx = grizaData.indexOf(grizaData.filter(x=>x.id==`gz-${grizaIdx}`).shift());
        }

        this.startDrawing = function (ev, uiElem, type) {
            this.createPath(type);
            drawMode = true;
            console.log('pen: active')

            let baseUnit = uiElem.grizaPannel.getBoundingClientRect();
            let originTop = baseUnit.top;
            let originLeft = baseUnit.left;
            let y = ev.pageY - originTop;
            let x = ev.pageX - originLeft;
            drawPath = `M ${x} ${y} `;
        }

        this.moveHandler = function (ev, uiElem) {
            if (!drawMode) return;
            let baseUnit = uiElem.grizaPannel.getBoundingClientRect();
            let originTop = baseUnit.top;
            let originLeft = baseUnit.left;
            let y = ev.pageY - originTop;
            let x = ev.pageX - originLeft;
            let type = '';
            if (drawPath.indexOf('L') == -1) type = 'L';
            drawPath += `${type} ${x} ${y} `;
            grizaData[selectedIdx].path = drawPath;
            this.grizaRender(grizaData, uiElem.grizaPannel);
        }

        this.resetDrawing = function () {
            drawMode = false;
            console.log('pen: reset');
            grizaIdx++;
            this.renderLayerBox();
        }

        this.removeLayer = function(target, uiElem){
            let id = target.getAttribute('griza-id');
            grizaData = grizaData.filter(draw=>draw.id!=id);
            this.grizaRender(grizaData, uiElem.grizaPannel);
            this.renderLayerBox();
        }

        this.endLineClose = function () {
            grizaData[selectedIdx].path = drawPath + 'z';
        }
        // pen tool setting end

        this.toolsModeHandler = function (ev) {
            let tool = ev.target;
            if (tool.className == 'off') {
                tool.classList.add('on');
                tool.classList.remove('off');
                tool.title = 'on';
            } else if (tool.className == 'on') {
                tool.classList.add('off');
                tool.classList.remove('on');
                tool.title = 'off';
            }
        }

        this.grizaRender = function (griza, pannel) {
            moduleView.grizaRender(griza, pannel);
        }

        this.renderLayerBox = function(){
            moduleView.grizaListView(grizaData);
        }

        this.removePath = function () {
            if (path) path.remove();
        }

        this.setGrizaData = function () {
            localStorage['griza'] = JSON.stringify(grizaData);
        }

        this.getGrizaData = function () {
            if (!localStorage['griza'] || localStorage['griza'].length == 0) {
                localStorage['griza'] = {};
            } else {
                grizaData = JSON.parse(localStorage['griza']);
            }
            // grizaRender add
        }

        // selet handler
        this.selectAcivating = function(target){
            console.log('selecting')
            target.setAttribute('griza-process', 'selecting');
            this.createSelectingBox(target, 'selecting');
        }

        this.selectDeactivating = function(target){
            if(target.getAttribute('griza-process') == 'selecting') target.removeAttribute('griza-process');
        }

        this.selectActivated = function(){
            console.log('selected')
            let targetPath = document.querySelector(`#${boundary.getAttribute('griza-path')}`);
            targetPath.setAttribute('griza-process', 'selected');
            this.selectResetHandler();
            this.createSelectingBox(targetPath, 'selected');
        }

        this.selectResetHandler = function(){
            if(boundary)boundary.remove();
        }

        this.createSelectingBox = function(target, state){
            let rect = target.getBoundingClientRect();
            let top = rect.top;
            let left = rect.left;
            let width = rect.width;
            let height = rect.height;
            let padding = 1*16;
            boundary = document.createElement('div');
            boundary.id = state;
            boundary.style.position = `absolute`;
            boundary.style.width = `${width+padding}px`;
            boundary.style.height = `${height+padding}px`;
            boundary.style.top = `${top-padding/2}px`;
            boundary.style.left = `${left-padding/2}px`;
            boundary.style.border = `1px solid rgba(0,0,0,0.1)`;
            boundary.style.zIndex = `14`;
            boundary.setAttribute('griza-path', `${target.id}`);
            document.body.append(boundary);

            if(state=='selected'){
                boundary.innerHTML = `
                    <div class="top-left" griza-grip="box"></div>
                    <div class="top-right" griza-grip="box"></div>
                    <div class="bottom-left" griza-grip="box"></div>
                    <div class="bottom-right" griza-grip="box"></div>

                    <div class="top" griza-grip="line"></div>
                    <div class="bottom" griza-grip="line"></div>
                    <div class="left" griza-grip="line"></div>
                    <div class="right" griza-grip="line"></div>
                `;
            }
        }
    }

    function View() {
        let uiElem = null;

        this.init = function (ui) {
            uiElem = ui;
        }

        this.grizaRender = function(griza, pannel){
            let allGriza = '';
            griza.forEach(draw=>{
                allGriza += `<path
                id="${draw.id}"
                style="stroke:${draw.style.stroke};
                fill:${draw.style.fill};
                stroke-width:${draw.style['stroke-width']};"
                d="${draw.path}"
                >
                </path>`
            });
            pannel.innerHTML = allGriza;
        }

        this.grizaListView = function(griza){
            this.clearListView();
            griza.forEach(draw=>{
                let paint = document.createElement('div');
                paint.classList.add('tool-layer-paint', 'w-flex', 'justify-content-between', 'align-items-center');
                paint.innerHTML = `
                    <span>
                        <span>${draw.name}</span>
                        <span>${draw.type}</span>
                        <span>${draw.order}</span>
                    </span>
                    <span griza-btn="del" griza-id="${draw.id}" class="btn btn-sm btn-danger fs-8" style="line-height: 1">X</span>
                `;
                uiElem.layerBox.append(paint);
            });
        }

        this.clearListView = function(){
            uiElem.layerBox.innerHTML = '';
        }
    }

    return {
        init: function () {
            const head = document.head;
            const body = document.body;
            const grizaPannel = document.querySelector('.griza-pannel');
            const layerBox = document.querySelector('.tool-layer');
            const toolGroup = document.querySelectorAll('[griza-group]');
            const pointer = document.getElementById('pointer');
            const pen = document.getElementById('pen');
            const move = document.getElementById('move');
            const tools = document.getElementById('tools');
            const magnet = document.getElementById('magnet');

            const toolList = {
                pointer,
                pen,
                move,
                tools,
                magnet,
            };

            for (let tool in toolList) {
                toolList[tool].classList.add('off');
                toolList[tool].title = 'off';
            }

            const ui = {
                head,
                body,
                grizaPannel,
                layerBox,
                toolGroup,
                ...toolList,
            };

            const view = new View();
            const model = new Model();
            const controller = new Controller();

            view.init(ui);
            model.init(view);
            controller.init(model, ui);
        }
    }
})();

const griza = Griza.init();

let leftSideBar = document.querySelector('.side-bar');
let leftSideBtn = document.querySelector('#leftSideBtn');
window.addEventListener('click', sideBarEnterHandler);

function sideBarEnterHandler(ev) {
    let target = ev.target;

    if (!target.parentNode || target.parentNode.id !== leftSideBtn.id) return;

    if (leftSideBar.classList.contains('hide')) {
        leftSideBar.classList.add('show');
        leftSideBar.classList.remove('hide');
        leftSideBtn.querySelector('i').classList.replace('fa-chevron-right', 'fa-chevron-left');
    } else if (leftSideBar.classList.contains('show')) {
        leftSideBar.classList.add('hide');
        leftSideBar.classList.remove('show');
        leftSideBtn.querySelector('i').classList.replace('fa-chevron-left', 'fa-chevron-right');
    }
}