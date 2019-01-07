/*
    locationMVM 3.5
    @devp : Lim Seokyoung
    @last-date : 2018.12.05
*/
lo = null;

(function(root) {

    var locationMVMVer = '3.5';

    if (!Object.prototype.wave) {
        //없으면 해당 작업 진행
        Object.defineProperty(Object.prototype, "wave", {
            configurable: true, //객체 삭제 가능 여부
            enumerable: false, //키 열거 가능 여부
            value: function(prop, callbacks) {

                var oldboat = this[prop], self = this, newboat = oldboat, unwave = false,
                    getter = function() { //호출할때
                        if(unwave){
                            return;
                        }

                        if(callbacks.wavelength){//wavelength 있으면..
                            var result = callbacks.wavelength.call(self, newboat, fnunwave);

                            if(result !== undefined){
                                newboat = result;
                            }
                            return newboat;
                        }
                        //wavelength 없으면 디폴트값
                        return newboat;
                    }
                    ,setter = function(val) { //수정할때
                        oldboat = newboat;

                        //해제 시도
                        if(val['$~unwave~$'] === true){
                            fnunwave();
                            return;
                        }

                        if(callbacks.waver){ //waver가 있으면..
                            var result = undefined;
                            result = callbacks.waver.call(self, oldboat, val, fnunwave);


                            if(result === undefined){
                                newboat = val;
                            }else{
                                newboat = result;
                            }

                            return newboat
                        }
                        //waver가 없으면 디폴트값
                        return newboat = val;
                    }
                    ,fnunwave = function(){
                        unwave = true;
                        delete self[prop]; //해당 프로퍼티 삭제
                        self[prop] = oldboat; //새로운 프로퍼티 생성 하고 남겨둔 old 값 대입
                        unwave = false;
                    };


                if (delete this[prop]) { // 기존의 프로퍼티 삭제후..

                    //재정의
                    Object.defineProperty(this, prop, {
                        get: getter, //getter 함수 입력
                        set: setter, //setter 함수 입력
                        configurable: true, //삭제가능
                        enumerable: true //읽기가능
                    });

                }

            }
        });
    }


    if (!Object.prototype.unwave) {
        Object.defineProperty(Object.prototype, "unwave", {
            configurable: true,value: function(prop) {
                this[prop] = {'$~unwave~$' : true};
            }
        });
    }

    var masterObject = null, plugin = {}, util = {},
        appMgrList = [], appMgr = null,
        viewMgr = null, keyMgr = null, mouseMgr = null, modelMgr = null,
        isHashView = false, // 해쉬 상태 체크
        navi = {}, //네비게이션 객체
        oldNavi = {},
        naviWatches = {}, //네비게이션 주시자 객체
        component = {}, //컴포넌트 객체
        baseComponent = {}, // 기본 컴포넌트 객체
        insObject = {},
        model = {}, //모델 객체
        view = {}, //뷰 객체
        ctrl = {}, // 컨트롤 객체
        globals = {
            variable : {},
            object : {},
            array : {},
            insObject : {},
            function : {}
        },
        messageItem = {},
        naviCtrl = null, componentGetSet = null, baseComponentGetSet = null, ctrlGetSet = null,
        modelGetSet = null, viewGetSet = null, globalsGetSet = null,
        pageView = {}, popupView = {}, eventModel = {},
        // ppViewGetSet = null,
        eventModelGetSet = null,
        jsRequireList = {},
        // aniFramePool 관련 변수들
        aniFramePool = null,
        aniFramePoolFPS = 30,
        aniFramePoolStackLength = 0,
        isAniFramePoolOn = false,
        isAniPlaying = false,
        aniFramePoolIndexList = [],
        aniFramePoolIndexListLength = 0,
        aniFramePoolList = {},
        aniFramePoolStackList = {};


    //메세지
    function message(name, item, fn1, fn2) {
        var selectCtrl = messageItem[name], ctrlItems = null;
        if (!selectCtrl) {
            messageItem[name] = {};
            selectCtrl = messageItem[name];
        }

        ctrlItems  = selectCtrl[item];

        if (!ctrlItems) {
            selectCtrl[item] = [];
            ctrlItems  = selectCtrl[item];
        }

        if (typeof fn1 === 'function') {
            ctrlItems.push(fn1);
        } else if(item !== '$remove' && fn1 === '$remove'){
            if (fn2) {
                var j = ctrlItems.length - 1;
                for (var i in ctrlItems) {
                    if (ctrlItems[i] === fn2) {
                        ctrlItems.splice(i, 1);
                        break;
                    }
                    if (ctrlItems[j] === fn2) {
                        ctrlItems.splice(j, 1);
                        break;
                    }
                    j--;
                }
            } else {
                selectCtrl[item] = [];
            }
        } else {
            for (var i in ctrlItems) {
                ctrlItems[i](fn1);
            }
            if (item === '$remove') {
                messageItem[name] = {};
            }
        }

    }

    /*
        @aapMgr
    */
    appMgr = function(appId){

        var self = this,
        body = new masterObject.$$('body'), // 바디 element
        appView = null, // 어플리케이션 뷰
        loadingComponent = null;

        self.id = appId;

        self.view = self.view || viewMgr();
        self.model =  self.model || modelMgr();
        self.keyEvent = self.keyEvent || keyMgr();
        self.mouseEvent = self.mouseEvent || mouseMgr();


        /*
            @appMgr.init()
            앱 초기화,
            - 앱에 관련된 디스플레이 매니저들을 전부 삭제하고 키 매니저는 초기화 한다.
            @prameters
            - Object datas {
                Object displayData {
                    Number width : 앱 디스플레이 가로 크기,
                    Number height :  앱 디스플레이 세로 크기,
                    Number x : 앱 디스플레이 최종 절대 X 좌표,
                    Number y : 앱 디스플레이 최종 절대 Y 좌표
                },
            }
        */
        self.init = function(datas){
            console.log('%clocationMVM appManager - ' + locationMVMVer, 'color : rgb(255, 100, 0); font-size : 50; font-weight : 900;');

            var displayData = datas.displayData, history = datas.history, keyEventListener = datas.keyEventListener,
            container = datas.container,
            rootStr = datas.rootPath, rootPath = typeof rootStr === 'string' ? rootStr : 'js',
            viewPath = rootPath + '/view',
            modelPath = rootPath + '/model',
            compoPath = rootPath + '/component',
            bCompoPath = rootPath + '/baseComponent',
            simpleLoading = datas.simpleLoading;

            if(typeof container === 'object'){
                if(appView){ appView.remove(); }
                if(container && container.nodeType >= 1){ // dom 객체일떄
                    appView = new masterObject.$$(container);
                }
            }else if(appView){
                appView.remove();
                appView = new masterObject.$$('div').setId('app');
            }else{
                appView = new masterObject.$$('div').setId('app');
            }

            loadingComponent = datas.loadingComponent || null;


            // 만약 로딩 컴포넌트가 존재 안하면 simpleLoading 을 확인한다.
            if(!loadingComponent && simpleLoading){
                var type = simpleLoading.type,
                imgList = simpleLoading.imgList, //이미지 리스트, 배열 or 문자열
                imgX = simpleLoading.x,
                imgY = simpleLoading.y,
                defaultImgList = simpleLoading.defaultImgList,
                repeatStartIndex = simpleLoading.startIndex,
                repeatEndIndex = simpleLoading.endIndex,
                frameTime = simpleLoading.frameTime, // 애니메이션 간격 시간
                color = simpleLoading.color; // 배경 색상

                loadingComponent = self.createSimpleLoading();

                if(typeof type === 'string'){
                    switch (type) {
                        case 'view' : break;
                        case 'url' :
                        default:
                        type = 'url';
                    }
                }else{
                    type = 'url';
                }

                if(!imgList || !imgList.length){
                    imgList = defaultImgList;
                }

                if(imgList && imgList.length){
                    /* 심플 로딩 컴포넌트 생성 */
                    loadingComponent.convertToList(type, imgList, imgX, imgY, repeatStartIndex, repeatEndIndex);
                    frameTime && loadingComponent.setFrameTime(frameTime);
                    color && loadingComponent.setColor(color);
                }

            }

            // 바디에 앱 추가 ( 가장 앞에 추가 한다, 첫 번째 인덱스 위치 )
            if(!container){
                body.absolute().setMargin().prepend(appView, 0);
            }

            // 뷰 초기화
            self.view && self.view.init({
                app : self,
                appView : appView,
                displayData : displayData,
                history : history && typeof history === 'object' ? history.view : undefined,
                loadingComponent : loadingComponent,
                path : viewPath,
                componentPath : compoPath,
                baseComponentPath : bCompoPath
            });

            self.model && self.model.init({
                path : modelPath
            });

            // 키 이벤트 초기화
            self.keyEvent && self.keyEvent.init({
                app : self,
                appView : appView,
                history : history && typeof history === 'object' ? history.keyEvent : undefined,
                loadingComponent : loadingComponent,
                keyEventListener : keyEventListener
            });

            // 마우스 이벤트 초기화
            self.mouseEvent && self.mouseEvent.init({
                app : self,
                appView : appView,
                history : history && typeof history === 'object' ? history.keyEvent : undefined,
                loadingComponent : loadingComponent,
                keyEventListener : keyEventListener
            });

            /* 웹 워커 */
            self.thread = function(threadPath){
                if(!(window && window.Worker)){ return false; }
                var self = this,
                worker = new window.Worker(rootPath + '/thread/' + threadPath);

                /* 받는 메세지 */
                self.on = function(callFn){
                    worker.onmessage = callFn;
                };
                /* 메세지 보내기 */
                self.toss = function(data){
                    worker.postMessage(data);
                };
                /* 닫기 */
                self.close = function(){
                    worker.terminate();
                    worker = null;
                };
            };

            return self;
        };

        self.resize = function(){};

        //전체 history 추가
        self.addHistory = function(datas){

            var viewHistoryList = datas.view, keyEventList = datas.keyEvent;


            for(var type in datas){
                var list = datas[type];

                if(list && Array.isArray(list)){

                    for(var i in list){
                        var item = list[i];
                        self[type].add(item);
                    }

                }
            }


            return self;
        };

        // 뷰 단위별 추가
        self.addViewHistory = function(viewType, viewId, fileName, prams, components, jsErr){
            !self.view || self.view.add(viewType, viewId, fileName, prams, components, jsErr);
            return self;
        };

        // 키 단위별 추가
        self.setKeyEvent = function(viewType, id, keySet, prevent){
            !self.keyEvent || self.keyEvent.add(viewType, id, keySet, prevent);
            return self;
        };

        /* 순간적으로 키의 컨슘을 푼다 */
        self.keyLock = function(value){
            self.keyEvent && self.keyEvent.keybackLock(value);
            return self;
        };

        // 키 단위별 추가
        self.setMouseEvent = function(viewType, id, keySet, prevent){
            // !self.keyEvent || self.keyEvent.add(viewType, id, keySet, prevent);
            return self;
        };

        // 키 막음 등록 (강제)
        self.setKeyPrevent = function(viewType, id, prevent){
            !self.keyEvent || self.keyEvent.setPrevent(viewType, id, prevent);
            return self;
        };

        // 키 정지 토글
        self.togglePauseKeyEvent = function(){
            !self.keyEvent || self.keyEvent.togglePause();
            return self;
        };
        // 키 정지
        self.keyEventPause = function(){
            !self.keyEvent || self.keyEvent.pause();
            return self;
        };

        // 키 활동
        self.keyEventAction = function(){
            !self.keyEvent || self.keyEvent.action();
            return self;
        };

        // 키 이벤트 반환
        self.getKeyEventListener = function(){
            return self.keyEvent.keyEventListener;
        };

        // 마우스 이벤트 토글
        self.togglePauseMouseEvent = function(){
            !self.mouseEvent || self.mouseEvent.togglePause();
        };
        // 마우스 이벤트 정지
        self.mouseEventPause = function(){
            !self.mouseEvent || self.mouseEvent.pause();
        };

        // 마우슨 이벤트 활동
        self.mouseEventAction = function(){
            !self.mouseEvent || self.mouseEvent.action();
        };


        // 전체 히스토리 반환
        self.getHistory = function(){
            var result = {
                view : self.view.getHistory(),
                keyEvent : self.keyEvent.getEventList()
            };
            return result;
        };

        // 히스토리 길이 반환
        self.getHistoryLength = function(type){
            return self.view.getLength(type);
        }

        self.getCurrentHistory = function(viewType){
            return self.view.getCurrentHistory(viewType);
        };

        self.getFocusedInfo = function(viewType){
            return self.view.getFocusedInfo()[viewType]
        };

        // 히스토리 롤백
        self.backHistory = function(count, type){
            self.view && self.view.back(count, type);
            return self;
        };

        // 특정 뷰 히스토리 삭제
        self.removeViewHistory = function(viewType, viewId){
            self.view && self.view.remove(viewType, viewId);
            return self;
        };

        // 특정 키 히스토리 삭제
        self.removeKeyEvent = function(viewType, id){
            !self.keyEvent || self.keyEvent.remove(viewType, id);
            return self;
        };

        // 키 모델 등록
        self.setKeyModel = function(models){
            for(var id in models){
                self.model && self.model.add(id, models[id]);
            }
            return self;
        };

        self.setModel = function(models){
            for(var id in models){
                self.model && self.model.add(id, models[id]);
            }
            return self;
        };

        // // 마우스 이벤트 모델 등록
        // self.setMouseModel = function(models){
        //     for(var id in models){
        //         self.model && self.model.add(id, models[id]);
        //     }
        //     return self;
        // };

        // 모델 강제 트리거
        self.modelTrigger = function(modelName, datas, keyEvent){
            var result = self.model.trigger(modelName, datas, keyEvent);
            return result;
        };

        /* 모델 동적 추가 */
        self.loadModel = function(array, callback, errFn, require){
            //app, array, callback, errFn, require
            !self.model || self.model.load(self, array, callback, errFn, require);
        };

        /* 로딩 트리거 */
        self.loading = {
            on : function(stackId, startTimeMils){
                loadingComponent.on(stackId, startTimeMils);
            },
            off : function(stackId, perfact){
                loadingComponent.off(stackId, perfact);
            }
        };

        // 메세지 기능
        self.message = function(type, id, messageData){
            self.view.message(type, id, messageData);
            return self;
        };

        /* 페이지 뷰 추가 */
        self.addView = function(type, viewName, setPrototype, setComponent, fn){
            return self.view.addView(type, viewName, setComponent, fn, setPrototype);
        };

        self.setView = function(type, viewName, setPrototype, setComponent, fn){
            return self.view.setView(type, viewName, setComponent, fn, setPrototype);
        };

        /* 파업 뷰 추가 */
        self.addPopupView = function(){};

        // 마지막 히스토리 기준으로 그리기
        self.apply = function(lastCallback, notLoading, requires){
            // 뷰를 그리기 시작하면 키 이벤트는 정지 시킴
            self.keyEvent && self.keyEvent.pause();
            self.mouseEvent && self.mouseEvent.pause();
            self.view.render(function(){

                self.keyEvent && self.keyEvent.apply({
                    modelTrigger : self.modelTrigger,
                    app : self,
                    focusedInfo : self.view.getFocusedInfo(),
                    viewResult : self.view.getViewResult(),
                    views : self.view.getViews()
                }, notLoading);

                self.mouseEvent && self.mouseEvent.apply({
                    modelTrigger : self.modelTrigger,
                    app : self,
                    focusedInfo : self.view.getFocusedInfo(),
                    viewResult : self.view.getViewResult(),
                    views : self.view.getViews()
                }, notLoading);

                // 키 이벤트가 적용된후 이벤트 정지 취소
                self.keyEvent && self.keyEvent.action();
                self.mouseEvent && self.mouseEvent.action();

                if(lastCallback){
                    lastCallback();
                }

            }, notLoading, requires);
            return self;
        };

        // 앱의 가로 크기
        self.getWidth = function(){
            return appView.getWidth();
        };

        // 앱의 세로 크기
        self.getHeight = function(){
            return appView.getHeight();
        };

        /* 로딩 컴포넌트 반환 */
        self.getLoadingComponent = function(){
            return loadingComponent;
        };

        /*
            심플 로딩 컴포넌트 생성
            - 로직은 loading baseComponent 와 흡사하다.
            - 기본적인 로딩 로직만 가지고 있다.
        */
        self.createSimpleLoading = function(){

            var loadingSelf = {},
            loadingCount = 0,
            view = new masterObject.$$('div').setId('loading'),
            imgList = [],
            app = null,
            nowAni = null,
            frameTime = 0.2,
            globalX = null, globalY = null,
            startTimeoutStack = {};

            view.absolute().fullSize().css('background-color', 'rgba(0,0,0, 0.8)').hide();

            loadingSelf.getView = function(){
                return view;
            };

            /*
                로딩 초기화
                - 이는 viewMgr 가 초기화 한다.
                - 유저가 사용할 필요가 없다.
            */
            loadingSelf.init = function(datas){
                app = datas.app;
                var displayData = datas.displayData;
                displayData && view.setSize(displayData.width||0, displayData.height||0);
                return loadingSelf;
            };

            loadingSelf.setFrameTime = function(value){
                frameTime = value;
                return loadingSelf;
            };

            loadingSelf.setImgSize = function(width, height){
                // imgView.setSize(width||0, height||0).center();
                return loadingSelf;
            };

            /* 로딩 이미지 리스트로 컨버터 */
            loadingSelf.convertToList = function(type, imgInfo, imgX, imgY, repeatStartIndex, repeatEndIndex){
                imgList = [];
                globalX = (typeof imgX === 'number' || typeof imgX === 'string') ? imgX : null;
                globalY = (typeof imgY === 'number' || typeof imgY === 'string') ? imgY : null;

                globalX = globalX === null ? 'pw/2-w/2' : globalX;
                globalY = globalY === null ? 'ph/2-h/2' : globalY;

                var list = [];

                if(type === 'url' && typeof imgInfo === 'string'){
                    repeatStartIndex = typeof repeatStartIndex === 'number' ? repeatStartIndex : 0;
                    repeatEndIndex = typeof repeatEndIndex === 'number' ? repeatEndIndex : 0;

                    for(var i=repeatStartIndex; i<=repeatEndIndex; i++){
                        list.push(imgInfo+i);
                    }
                }else if(Array.isArray(imgInfo)){
                    list = imgInfo;
                }

                if(type === 'view'){
                    var resultLength = list.length;
                    for(var i = 0; i<resultLength; i++){
                        ViewSet(list[i].$$imgView);
                    }
                }else{
                    masterObject.imgLoad({imgUrlList : list, callback: function(result){
                        var resultLength = result.length;
                        for(var i = 0; i<resultLength; i++){
                            ViewSet(result[i].$$imgView);
                        }
                    }});
                }

            };

            function ViewSet(itemView){
                itemView.abs().appendTo(view);
                itemView.setXY(globalX, globalY);
                imgList.push(itemView.hide());
            }

            loadingSelf.setOpercity = function(alp){
                view.css('background-color', 'rgba(0,0,0,'+alp+')');
                return loadingSelf;
            };

            loadingSelf.setColor = function(rgba){
                view.css('background-color', rgba);
                return loadingSelf;
            };


            loadingSelf.on = function(stackId, startTimeMils){
                loadingCount++;

                if(startTimeMils){
                    startTimeoutStack[stackId] = setTimeout(function(){
                        loadingCount && view.show();
                        loadingCount && (nowAni || triggerAnimation());
                    }, startTimeMils);
                }else{
                    loadingCount && view.show();
                    loadingCount === 1 && triggerAnimation();
                }

                return loadingSelf;
            };

            loadingSelf.off = function(stackId, perfact){

                if(typeof stackId === 'string'){
                    clearTimeout(startTimeoutStack[stackId]);
                    delete startTimeoutStack[stackId];
                }else if(Array.isArray(stackId)){
                    var stackIdList = stackId, stackLength = stackIdList.length;
                    for(var i=0; i<stackLength; i++){
                        var stackId = stackIdList[i];
                        clearTimeout(startTimeoutStack[stackId]);
                        delete startTimeoutStack[stackId];
                    }
                }

                loadingCount && loadingCount--;
                if(perfact){ loadingCount = 0; }
                if(!loadingCount){
                    nowAni && nowAni();
                    nowAni = null;
                    view.hide()
                }
                return loadingSelf;
            };

            loadingSelf.isWorked = function(callback){
                if(loadingCount){
                    !callback || callback();
                    return true;
                }else{
                    return false;
                }
            };

            function triggerAnimation(){

                var count = 0, beforeCount = 0, maxCount = imgList.length -1;

                imgList[count] && imgList[count].setXY(globalX, globalY).show();

                nowAni = masterObject.aniFrame(frameTime, function(data){
                    maxCount = imgList.length -1
                    if(data.per > 100){
                        count > maxCount && (count = 0);

                        imgList[beforeCount].hide();
                        imgList[count].setXY(globalX, globalY).show();

                        beforeCount = count++;
                        data.timeReset();
                    }
                }, function(){
                    imgList[beforeCount].hide();
                });
            }

            return loadingSelf;
        };

    };

    /*
        @viewMgr
        - appMgr 의 화면 구성과 viewHistory를 담당한다.
    */
    viewMgr = function(){

        var self = {},
        appMgr = null,
        globals = masterObject.global,
        gInstance = globals.instance,
        path = 'js/view',
        compoPath = 'js/component',
        bCompoPath = 'js/baseComponent',
        display = new masterObject.$$('div').setId('display'),
        layout = {
            page : new masterObject.$$('div').setId('page'), // 레이아웃 페이지
            popup : new masterObject.$$('div').setId('popup') // 레이아웃 팝업
        },
        childViews = {
            popup : {}, page : {}
        },
        isRender = false,
        viewResult = [], // 화면에 보여지는 결과 뷰
        focusedInfo = {
            page : null, popup : null
        },
        loadingComponent = null,
        otherLoading = null,
        history = {
            stack : {
                page : [],
                popup : []
            },
            page : {}, popup : {}, toast : []
        },
        onDestroy = {
            page : {}, popup : {}
        };

        self.getFocusedInfo = function(){
            return focusedInfo;
        };

        // 초기화
        self.init = function(datas){

            appMgr = datas.app;

            path = datas.path || 'js/view';
            compoPath = datas.componentPath || 'js/component';
            bCompoPath = datas.baseComponentPath || 'js/baseComponent';
            viewResult = [];

            var appView = datas.appView, displayData = datas.displayData, historyData = datas.history;

            loadingComponent = datas.loadingComponent || null;
            otherLoading = datas.otherLoading;

            datas.appView.append(display);

            display.absolute().css({
                width : '100%', height : '100%',
                left : 0, top : 0,
                overflow : 'hidden'
            }).append(layout);

            layout.page.absolute().fullSize();
            layout.popup.absolute().fullSize();


            if(displayData){

                display.setXY(displayData.x || 0, displayData.y || 0);

                switch (displayData.type) {
                    case 'full':{ // 윈도우 크기 중심으로 풀 사이즈
                        display.setSize('ww', 'wh');
                        window.addEventListener('resize', function(){
                            display.setSize('ww', 'wh');
                        });
                        break;
                    }
                    case 'static': // 사용자 정의 사이즈, width와 height 경우 스트링 값으로 넘어오면 리사이즈 이밴트 발동
                    default:{
                        if(typeof displayData.width === 'string' && typeof displayData.height === 'string'){

                            window.addEventListener('resize', function(){
                                display.setSize(displayData.width, displayData.height);
                            });

                        }else if(typeof displayData.width === 'string'){
                            display.setHeight(displayData.height);
                            window.addEventListener('resize', function(){
                                display.setWidth(displayData.width);
                            });
                        }else if(typeof displayData.height === 'string'){
                            display.setWidth(displayData.width);
                            window.addEventListener('resize', function(){
                                display.setHeight(displayData.height);
                            });
                        }else{
                            display.setSize(displayData.width || 0, displayData.height || 0);
                        }
                    }
                }

            }

            if(loadingComponent){
                loadingComponent.init({
                    app : appMgr,
                    display : self,
                    displayData : displayData
                });
                datas.appView.append(loadingComponent.getView());
            }

            if(historyData){
                history = historyData;
            }else{
                history = {
                    stack : {
                        page : [],
                        popup : []
                    },
                    page : {}, popup : {}
                };
            }
        };

        self.resize = function(){};

        /* 페이지 뷰 추가 */
        self.addView = function(type, viewName, setComponent, fn, setPrototype){
            if( (type === 'page' || type === 'popup') && typeof viewName === 'string' && typeof fn === 'function'){
                if(childViews[type][viewName]){
                    console.error('['+viewName +'] is Working!');
                    return false;
                }
                childViews[type][viewName] = {
                    fn : fn,
                    setComponent : setComponent || [],
                    setPrototype : setPrototype
                };
                return true;
            }
            return false;
        };

        self.setView = function(type, viewName, setComponent, fn, setPrototype){
            if( (type === 'page' || type === 'popup') && typeof viewName === 'string' && typeof fn === 'function'){
                childViews[type][viewName] = {
                    fn : fn,
                    setComponent: setComponent || [],
                    // {
                    //     component : [], baseComponent : []
                    // },
                    setPrototype : setPrototype
                };
                return true;
            }
            return false;
        };

        // 히스토리 추가
        self.add = function(viewType, viewId, fileName, prams, components, jsErr){

            if(Array.isArray(viewType)){
                viewId = viewType[1];
                fileName = viewType[2];
                prams = viewType[3];
                components = viewType[4];
                jsErr = viewType[5];
                viewType = viewType[0];
            }

            if(viewType === 'stack'){
                return false;
            }

            if(!history[viewType][viewId]){

                history[viewType][viewId] = {
                    type : viewType,
                    id : viewId,
                    fileName : fileName,
                    data : prams,
                    view : null,
                    isNew : true,
                    components : components || [],
                    component : {},
                    jsErr : typeof jsErr === 'function' ? jsErr : null,
                    app : appMgr,
                    appMgr : appMgr
                };

                //아이디가 스택으로 쌓임
                history.stack[viewType].push(viewId);

            }else{
                console.error('history VIEW['+viewType+'] in ID['+ viewId +'] counting!');
                return false;
            }

            return true;
        };

        /* 특정 히스토리 스택의 순서를 변경 */
        self.move = function(viewType, viewId, movePoint){
            var stackArray = history.stack[viewType],
            index = self.getStackIndex(viewType, viewId),
            movepointType = typeof movePoint;

            if(index > 0){ // 스택에 아이디가 존재 한다면
                if(movepointType === 'string'){
                    movePoint = self.getStackIndex(viewType, movePoint);
                }

                if(movePoint > 0){
                    if(movePoint < index){
                        stackArray.splice(index, 1);
                        stackArray.splice(movePoint, 0, viewId);
                    }else if(movePoint > index){
                        stackArray.splice(movePoint, 0, viewId);
                        stackArray.splice(index, 1);
                    }

                    return true;
                }

            }
            return false;
        };

        /* 스택의 특정 아이디의 인덱스를 반환 */
        self.getStackIndex = function(viewType, viewId){
            var stackArray = history.stack[viewType], index = stackArray.indexOf(viewId);
            return index;
        };

        self.getLength = function(type){
            var stack = history.stack;
            if(type){
                return stack[type].length;
            }else{
                return stack.page.length + stack.popup.length;
            }
        };

        /* 히스토리를 롤백
            파업 히스토리 순서대로 롤백
         */
        self.back = function(count, type){
            var stack = history.stack;
            if(count){
                for(var i=0; i<count; i++){
                    self.back(null, type);
                }
            }else{

                if(type){
                    var id = stack[type].pop();
                    delete history[type][id];
                    var destroyEvent = onDestroy[type][id];
                    typeof destroyEvent === 'function' && destroyEvent(type, id);
                }else{
                    var popup = stack.popup.pop();
                    if(popup){
                        delete history.popup[popup];
                        var destroyEvent = onDestroy.popup[popup];
                        typeof destroyEvent === 'function' && destroyEvent('popup', popup);
                    }else{
                        var page = stack.page.pop();
                        if(page){
                            delete history.page[page];
                            var destroyEvent = onDestroy.page[page];
                            typeof destroyEvent === 'function' && destroyEvent('page', page);
                        }
                    }
                }

            }
        };

        /* 특정 히스토리를 삭제 */
        self.remove = function(viewType, viewId){
            try {
                if(!viewType && !viewId){ // 모든 히스토리 뷰 삭제

                    history.stack['popup'] = [];
                    history['popup'] = {};
                    var onDestroyType = onDestroy['popup'];
                    for(var i in onDestroyType){
                        var onDestroyFun = onDestroyType[i];
                        typeof onDestroyFun === 'function' && onDestroyFun('popup', i);
                        delete onDestroyType[i];
                    }

                    history.stack['page'] = [];
                    history['page'] = {};
                    var onDestroyType = onDestroy['page'];
                    for(var i in onDestroyType){
                        var onDestroyFun = onDestroyType[i];
                        typeof onDestroyFun === 'function' && onDestroyFun('page', i);
                        delete onDestroyType[i];
                    }

                    return true;
                }else if(!viewType && viewId){

                    var pageStackArray = history.stack['page'],
                    popupStackArray = history.stack['popup'],
                    pageIndex = -1, popupIndex = -1,
                    sucResult = false;

                    pageIndex = pageStackArray.indexOf(viewId);
                    popupIndex = popupStackArray.indexOf(viewId);

                    if(popupIndex > -1){
                        popupStackArray.splice(popupIndex, 1);
                        delete history['popup'][viewId];
                        var destroyEvent = onDestroy['popup'][viewId];
                        typeof destroyEvent === 'function' && destroyEvent('popup', viewId);
                        delete onDestroy['popup'][viewId];
                        sucResult = true;
                    }

                    if(pageIndex > -1){
                        pageStackArray.splice(pageIndex, 1);
                        delete history['page'][viewId];
                        var destroyEvent = onDestroy['page'][viewId];
                        typeof destroyEvent === 'function' && destroyEvent('page', viewId);
                        delete onDestroy['page'][viewId];
                        sucResult = true;
                    }

                    return sucResult;
                }else if(viewType && !viewId){ // 특정 그룹만 삭제

                    history.stack[viewType] = [];
                    history[viewType] = {};
                    var onDestroyType = onDestroy[viewType];

                    for(var i in onDestroyType){
                        var onDestroyFun = onDestroyType[i];
                        typeof onDestroyFun === 'function' && onDestroyFun(viewType, i);
                        delete onDestroyType[i];
                    }

                    return true;
                }


                var stackArray = history.stack[viewType], index = -1;
                index = stackArray.indexOf(viewId);

                if(stackArray && index >= 0){
                    stackArray.splice(index, 1);
                    delete history[viewType][viewId];
                    var destroyEvent = onDestroy[viewType][viewId];
                    typeof destroyEvent === 'function' && destroyEvent(viewType, viewId);
                    delete onDestroy[viewType][viewId];
                    return true;
                }

                return false;
            } catch (e) {
                return false;
            }
        };

        self.message = function(type, id, messageData){
            try {
                var viewMessage = history[type][id].view.message;
                typeof viewMessage === 'function' && viewMessage(messageData);
                return true;
            } catch (e) {
                return false;
            }
        };

        /* 마지막 히스토리 기준으로 랜더링 */
        self.render = function(lastCallback, notLoading, requires){

            var pageHistory = history.page, popupHistory = history.popup,
            stack = history.stack, pageArray = stack.page, popupArray = stack.popup,
            pageArrayLength = pageArray.length, popupArrayLength = popupArray.length, result = [];

            viewResult = [];

            // viewResult에 마지막 페이지 등록
            if(pageArrayLength > 0){
                var id = pageArray[pageArrayLength-1], historyItem = pageHistory[id];
                viewResult.push(historyItem);
            }

            // viewResult에 팝업 등록
            if(popupArrayLength > 0){
                for(var i in popupArray){
                    var id = popupArray[i], historyItem = popupHistory[id];
                    viewResult.push(historyItem);
                }
            }


            if(viewResult.length <= 0){
                startRender();
                return false;
            }

            // 뷰 로드 루프
            (function loadLoop(indexCount, loadMaxCount){
                var item = viewResult[indexCount], type = item.type, id = item.id,
                fileName = item.fileName, data = item.data, components = item.components,
                jsErr = item.jsErr;

                if(item.view){
                    item.isNew = false;
                    focusedInfo[type] = item;
                    indexCount++;
                    if(indexCount <= loadMaxCount){
                        loadLoop(indexCount, loadMaxCount);
                    }else{
                        startRender(); // 그리기 시작
                    }
                    return false;
                }

                loadingComponent && (notLoading || loadingComponent.on());

                masterObject.loadOn(path + '/' + type, [fileName], '.js', function(){
                    // var view = ppViewGetSet[type].get(fileName, {
                    //     type : type, id : id, data : data, app : app, appMgr : app
                    // });
                    var view = null, childViewItem = childViews[type][fileName];
                    if(childViewItem){

                        var itemComponent = childViewItem.setComponent || [];

                        for(var i in itemComponent){
                            components.push(itemComponent[i]);
                        }

                        childViewItem.fn.prototype.appMgr = appMgr;

                        setComponentPrototype(childViewItem.setPrototype, childViewItem.fn.prototype, function(){

                            view = new childViewItem.fn(item);

                            item.view = view; // viewResult에 view 등록
                            item.isNew = true;
                            focusedInfo[type] = item;

                            if(components.length){

                                masterObject.loadOn(compoPath, components, '.js', function(c,c,nameList){
                                    var maxCount = nameList.length;
                                    (function loop(count){

                                        var name = nameList[count], copomItem = component[name];
                                        count++;
                                        if(copomItem){

                                            copomItem.fn.prototype.appMgr = appMgr;
                                            setFreeLoadComponent(copomItem.setPrototype, function(){
                                                item.component[name] = function(datas){
                                                    setComponentPrototype(copomItem.setPrototype, copomItem.fn.prototype);
                                                    return new copomItem.fn(datas);
                                                };
                                                if(maxCount>count){
                                                    loop(count);
                                                }else{

                                                    indexCount++;
                                                    if(indexCount <= loadMaxCount){
                                                        loadLoop(indexCount, loadMaxCount);
                                                    }else{
                                                        startRender(); // 그리기 시작
                                                    }

                                                }
                                            }, bCompoPath, requires);
                                        }

                                    })(0);

                                }, function(){
                                    jsErr && jsErr('componentErr');
                                }, requires);

                            }else{

                                indexCount++;
                                if(indexCount <= loadMaxCount){
                                    loadLoop(indexCount, loadMaxCount);
                                }else{
                                    startRender(); // 그리기 시작
                                }

                            }

                        }, bCompoPath, requires);
                    }

                    // var view = ppViewGetSet[type].get(fileName, item);

                }, function(){
                    jsErr && jsErr('mainErr');
                    loadingComponent && (notLoading || loadingComponent.off());
                }, requires);


            })(0, viewResult.length-1);

            function startRender(){

                display.removeChild();
                layout.page.removeChild();
                layout.popup.removeChild();
                for(var i in viewResult){

                    try {
                        var item = viewResult[i], type = item.type, id = item.id, view = item.view, data = item.data, isNew = item.isNew, itemComponent = item.component;
                        layout[type].appendTo(display).append(view.getView());
                        isNew && view.init(type, id, data, itemComponent); // 새로운 뷰가 아니면 초기화 실행
                        isNew || view.refresh && view.refresh(type, id, data, itemComponent);

                        if(view.onDestroy){
                            onDestroy[type][id] = view.onDestroy;
                        }

                        loadingComponent && isNew && (notLoading || loadingComponent.off());
                    } catch (e) {
                        console.log(e);
                        continue;
                    }
                }

                if(lastCallback){
                    lastCallback();
                }

            }


        };

        self.getViewResult = function(){
            return viewResult;
        };

        self.getCurrentHistory = function(viewType){
            if(viewType){
                var stackArray = history.stack[viewType];
                return stackArray[stackArray.length-1];
            }else{
                var pageStackArray = history.stack.page,
                popupStackArray = history.stack.popup;
                return {
                    page : pageStackArray[pageStackArray.length-1],
                    popup : popupStackArray[popupStackArray.length-1]
                };
            }
        };

        self.getHistory = function(){
            return history.stack;
        };

        self.getViews = function(){
            return history;
        };

        self.getWidth = function(){
            return display.getWidth();
        };

        self.getHeight = function(){
            return display.getHeight();
        };

        window.addEventListener('resize', function(){

            for(var i in viewResult){
                var resizeFn = viewResult[i].view.resize;
                resizeFn && resizeFn({
                    width : window.innerWidth,
                    height : window.innerHeight
                },{
                    width : display.getWidth(),
                    height : display.getHeight()
                });
            }

        });


        return self;
    };


    /*
        @keyMgr
    */
    keyMgr = function(){

        var self = {},
        history = {
            page : {}, popup : {}
        },
        keybackLock = false,
        nowDatas = null,
        viewResult = null,
        app = null, focusedInfo = null, modelTrigger = null,
        pause = false,
        loadingComponent = null,
        registerDefulatEvent = false;


        /* 키 초기화 */
        self.init = function(datas){

            var historyData = datas.history, keyEventListener = datas.keyEventListener;

            loadingComponent = datas.loadingComponent;

            // if(historyData && typeof historyData){
            //     history = historyData;
            // }else{
            //     history = {
            //         page : {}, popup : {}
            //     };
            // }

            if(keyEventListener){
                /* 외부 키 이벤트가 존재하면 기존의 이벤트는 삭제, 재 배정한다. */
                self.removeDefaultEvent();
                keyEventListener(localKeyEvent, self.keyFormatConvert);
            }else{
                self.addDefaultEvent();
            }
        };

        /* 키 이벤트 히스토리 추가 */
        self.add = function(viewType, viewId, keySet, prevent){

            if(Array.isArray(viewType)){
                viewId = viewType[1];
                keySet = viewType[2];
                prevent = viewType[3] ? true : false;
                viewType = viewType[0];
            }

            history[viewType][viewId] = {
                keySet : keySet, prevent : prevent ? true : false
            };
        };


        /* 키 히스토리 롤백 */
        self.remove = function(viewType, id){
            delete history[viewType][id];
        };

        /* 키 히스토리 반환
            last 인자 값이 true 라면 히스토리의 마지만 부분만 반환 한다.
        */
        self.getEventList = function(viewType, id){

            if(viewType && id){
                return history[viewType][id];
            }else if(viewType){
                return history[viewType];
            }else if(id){
                return {
                    page : history.page[id], popup : history.popup[id]
                };
            }else{
                return history;
            }

        };

        /* 마지막 keyset 적용 */
        self.apply = function(datas){
            nowDatas = datas;
            app = datas.app;
            modelTrigger = datas.modelTrigger;
            focusedInfo = datas.focusedInfo;
            viewResult = datas.viewResult;
            views = datas.views;
        };


        /* 해당 키의 이벤트 흐름 막음 설정 */
        self.setPrevent = function(viewType, id, prevent){
            var keyInfo = history[viewType][id];
            if(keyInfo){
                keyInfo.prevent = prevent ? true : false;
                return true;
            }
            return false;
        };

        /* 순간적으로 키 컨슘을 푼다 */
        self.keybackLock = function(value){
            if(typeof value === 'boolean'){
                keybackLock = value;
            }else{
                if(keybackLock){
                    keybackLock = false;
                }else{
                    keybackLock = true;
                }
            }

            return keybackLock;
        };

        /* 키 먹힘 일시 정지 */
        self.pause = function(){
            pause = true;
        };

        /* 키 먹힘 일시 정지 풀기 */
        self.action = function(){
            pause = false;
        };

        self.isPause = function(){
            return pause;
        };

        self.togglePause = function(){
            if(pause){
                pause = false;
            }else{
                pause = true;
            }
        };

        /*  */
        self.togglePreventMW = function(){
        };

        self.setPreventMW = function(){
        };

        self.keyCodeToss = function(){

        };

        /*
            키 변환 함수
            키 코드를 리모컨 이름에 맞게 변환
        */
        self.keyConvert = function(keyCode){

            switch (keyCode) {
                case 71 : {
                    keyCode = 'green';
                    break;
                }
                case 89 : {
                    keyCode = 'yellow';
                    break;
                }
                case 66 : {
                    keyCode = 'blue';
                    break;
                }
                case 8: {
                    keyCode = 'back';
                    break;
                }
                case 13: {
                    keyCode = 'enter';
                    break;
                }
                case 38: {
                    keyCode = 'arrowUp';
                    break;
                }
                case 40: {
                    keyCode = 'arrowDown';
                    break;
                }
                case 39: {
                    keyCode = 'arrowRight';
                    break;
                }
                case 37: {
                    keyCode = 'arrowLeft';
                    break;
                }
                case 48: {
                    keyCode = 'num0';
                    break;
                }
                case 49: {
                    keyCode = 'num1';
                    break;
                }
                case 50: {
                    keyCode = 'num2';
                    break;
                }
                case 51: {
                    keyCode = 'num3';
                    break;
                }
                case 52: {
                    keyCode = 'num4';
                    break;
                }
                case 53: {
                    keyCode = 'num5';
                    break;
                }
                case 54: {
                    keyCode = 'num6';
                    break;
                }
                case 55: {
                    keyCode = 'num7';
                    break;
                }
                case 56: {
                    keyCode = 'num8';
                    break;
                }
                case 57: {
                    keyCode = 'num9';
                    break;
                }
            }

            return keyCode;
        };

        self.groupKeyConvert = function(keyCode){

            if(48 <= keyCode && keyCode <= 57){
                keyCode = 'groupNum';
            }

            return keyCode;
        };

        self.keyFormatConvert = function(keyEvent){

            var realKeyCode = keyEvent.keyCode || keyEvent,
            keyCode = null,
            groupKeyCode = null,
            key = null;
            switch (realKeyCode) {
                case 415 :
                case 71 : {
                    groupKeyCode = 'groupLower';
                    key = 'g';
                    keyCode = 'green';
                    break;
                }
                case 89 : {
                    groupKeyCode = 'groupLower';
                    key = 'y';
                    keyCode = 'yellow';
                    break;
                }
                case 403 :
                case 82 : {
                    groupKeyCode = 'groupLower';
                    key = 'r';
                    keyCode = 'red';
                    break;
                }
                case 406 :
                case 66 : {
                    groupKeyCode = 'groupLower';
                    key = 'b';
                    keyCode = 'blue';
                    break;
                }
                case 8: {
                    groupKeyCode = 'groupAction';
                    key = 'Backspace';
                    keyCode = 'backSpace';
                    break;
                }
                case 13: {
                    groupKeyCode = 'groupAction';
                    key = 'Enter';
                    keyCode = 'enter';
                    break;
                }
                case 38: {
                    groupKeyCode = 'groupArrow';
                    key = 'ArrowUp';
                    keyCode = 'arrowUp';
                    break;
                }
                case 40: {
                    groupKeyCode = 'groupArrow';
                    key = 'ArrowDown';
                    keyCode = 'arrowDown';
                    break;
                }
                case 39: {
                    groupKeyCode = 'groupArrow';
                    key = 'ArrowRight';
                    keyCode = 'arrowRight';
                    break;
                }
                case 37: {
                    groupKeyCode = 'groupArrow';
                    key = 'ArrowLeft';
                    keyCode = 'arrowLeft';
                    break;
                }
                case 48: {
                    groupKeyCode = 'groupNum';
                    key = '0';
                    keyCode = 'num0';
                    break;
                }
                case 49: {
                    groupKeyCode = 'groupNum';
                    key = '1';
                    keyCode = 'num1';
                    break;
                }
                case 50: {
                    groupKeyCode = 'groupNum';
                    key = '2';
                    keyCode = 'num2';
                    break;
                }
                case 51: {
                    groupKeyCode = 'groupNum';
                    key = '3';
                    keyCode = 'num3';
                    break;
                }
                case 52: {
                    groupKeyCode = 'groupNum';
                    key = '4';
                    keyCode = 'num4';
                    break;
                }
                case 53: {
                    groupKeyCode = 'groupNum';
                    key = '5';
                    keyCode = 'num5';
                    break;
                }
                case 54: {
                    groupKeyCode = 'groupNum';
                    key = '6';
                    keyCode = 'num6';
                    break;
                }
                case 55: {
                    groupKeyCode = 'groupNum';
                    key = '7';
                    keyCode = 'num7';
                    break;
                }
                case 56: {
                    groupKeyCode = 'groupNum';
                    key = '8';
                    keyCode = 'num8';
                    break;
                }
                case 57: {
                    groupKeyCode = 'groupNum';
                    key = '9';
                    keyCode = 'num9';
                    break;
                }
                case 608 :
                case 461: {
                    groupKeyCode = 'groupAction';
                    key = 'Back';
                    keyCode = 'back';
                    break;
                }
                case 27: {
                    groupKeyCode = 'groupAction';
                    key = 'Esc';
                    keyCode = 'esc';
                    break;
                }
                case 436 : {
                    groupKeyCode = 'groupEtc';
                    key = 'AppStore';
                    keyCode = 'appStore';
                    break;
                }
                case 457 : {
                    groupKeyCode = 'groupEtc';
                    key = 'Widget';
                    keyCode = 'widget';
                    break;
                }
            }

            return {
                keyValue : key,
                realKeyCode : realKeyCode,
                keyCode : keyCode,
                groupCode : groupKeyCode,
                consume: function(){
                    keyEvent.preventDefault();
        			keyEvent.stopPropagation();
        			keyEvent.stopImmediatePropagation();
                }//keyEvent.preventDefault || function(){}
            }
        };

        /*
            로컬 키 이벤트
            - 외부 키이벤트가 없으면 해당 키이벤트가 적용된다.
        */
        function localKeyEvent(keyEvent){
            // var convertKeyInfo = self.keyConvert(keyEvent.keyCode);
            keyEventCallBack(self.keyFormatConvert(keyEvent));
        }

        self.keyEventTrigger = keyEventCallBack;

        function keyEventCallBack(keyEvent){

            var key = keyEvent.keyCode, groupKey = keyEvent.groupCode, isLoading = null;

            if(loadingComponent){
                isLoading = loadingComponent.isWorked();
            }

            try {
                if(!pause && viewResult && !isLoading){ // 정지 상태가 아니냐, 뷰 결과가 있느냐, 로딩 중이 아이냐
                    for(var i = viewResult.length-1; i >= 0; i--){
                        var item = viewResult[i],
                        type = item.type,
                        id = item.id,
                        keyInfo = history[type][id];

                        if(keyInfo){

                            var keySet = keyInfo.keySet[key], groupKeySet = keyInfo.keySet[groupKey],
                            prevent = keyInfo.prevent;

                            if(keySet){

                                for(var modelId in keySet){

                                    var modelName = keySet[modelId], pass = false;

                                    // 모델에 저장된 트리거 실행
                                    pass = modelTrigger(modelName, {
                                        modelName : modelName,
                                        app : app,
                                        target : item,
                                        focusedInfo : focusedInfo,
                                        viewResult : viewResult
                                    }, keyEvent);

                                    if(pass){
                                        break;
                                    }
                                }

                            }

                            if(groupKeySet){

                                for(var modelId in groupKeySet){

                                    var modelName = groupKeySet[modelId], pass = false;

                                    // 모델에 저장된 트리거 실행
                                    pass = modelTrigger(modelName, {
                                        modelName : modelName,
                                        app : app,
                                        target : item,
                                        focusedInfo : focusedInfo,
                                        viewResult : viewResult
                                    }, keyEvent);

                                    if(pass){
                                        break;
                                    }
                                }
                            }


                            if(prevent){
                                // console.error('['+type + ']['+id+'] key prevent!');
                                break;
                            }
                        }

                    }

                }
            } catch (e) {
                console.log('↓↓↓↓locationMVM keyEventListener ERROR!!!↓↓↓↓');
                console.log(e);
                console.log('↑↑↑↑locationMVM keyEventListener ERROR!!!↑↑↑↑');

            }


            if(keybackLock){
                keyEvent.consume();
            }

        }

        self.removeDefaultEvent = function(){
            window.removeEventListener('keydown', localKeyEvent);
            registerDefulatEvent = false;
        };

        self.addDefaultEvent = function(){
            window.addEventListener('keydown', localKeyEvent);
            registerDefulatEvent = true;
        };

        self.keyEventListener = localKeyEvent;


        /* 키 이벤트 리스너 */
        // self.addDefaultEvent();
        // window.addEventListener('keydown', localKeyEvent);



        return self;
    };

    mouseMgr = function(){

        var self = {},
        history = {
            page : {}, popup : {}
        },
        nowDatas = null,
        viewResult = null,
        views = null,
        app = null, focusedInfo = null, modelTrigger = null,
        pause = false,
        loadingComponent = null;


        /* 키 초기화 */
        self.init = function(datas){

            var historyData = datas.history;

            loadingComponent = datas.loadingComponent;

            if(historyData && typeof historyData){
                history = historyData;
            }else{
                history = {
                    page : {}, popup : {}
                };
            }

        };

        /* 키 이벤트 히스토리 추가 */
        self.add = function(viewType, viewId, keySet, prevent){

            if(Array.isArray(viewType)){
                viewId = viewType[1];
                keySet = viewType[2];
                prevent = viewType[3] ? true : false;
                viewType = viewType[0];
            }

            history[viewType][viewId] = {
                keySet : keySet, prevent : prevent ? true : false
            };
        };


        /* 키 히스토리 롤백 */
        self.remove = function(viewType, id){
            delete history[viewType][id];
        };

        /* 키 히스토리 반환
            last 인자 값이 true 라면 히스토리의 마지만 부분만 반환 한다.
        */
        self.getEventList = function(viewType, id){

            if(viewType && id){
                return history[viewType][id];
            }else if(viewType){
                return history[viewType];
            }else if(id){
                return {
                    page : history.page[id], popup : history.popup[id]
                };
            }else{
                return history;
            }

        };

        /* 마지막 keyset 적용 */
        self.apply = function(datas){
            nowDatas = datas;
            app = datas.app;
            modelTrigger = datas.modelTrigger;
            focusedInfo = datas.focusedInfo;
            viewResult = datas.viewResult;
            views = datas.views;
        };


        /* 해당 키의 이벤트 흐름 막음 설정 */
        self.setPrevent = function(viewType, id, prevent){
            var keyInfo = history[viewType][id];
            if(keyInfo){
                keyInfo.prevent = prevent ? true : false;
                return true;
            }
            return false;
        };

        /* 키 먹힘 일시 정지 */
        self.pause = function(){
            pause = true;
        };

        /* 키 먹힘 일시 정지 풀기 */
        self.action = function(){
            pause = false;
        };

        self.isPause = function(){
            return pause;
        };

        self.togglePause = function(){
            if(pause){
                pause = false;
            }else{
                pause = true;
            }
        };

        /*  */
        self.togglePreventMW = function(){
        };

        self.setPreventMW = function(){
        };
        var beforTest = null;
        function keyEventCallBack(mEvent){
            var isLoading = null, eventType = mEvent.type, targetData = mEvent.target.$$mouseEventData;
            // console.log(eventType);
            targetData = typeof targetData === 'object' ? targetData : null;

            if(loadingComponent){
                isLoading = loadingComponent.isWorked();
            }

            // console.log(e.keyCode);
            if(targetData && !pause && !isLoading){ // 정지 상태가 아니냐, 로딩 중이 아이냐

                var modelsList = targetData.models || {},
                models = modelsList[eventType] || [],
                type = targetData.type, id = targetData.id,
                prams = targetData.prams || null,
                viewsType = type && views[type] || {},
                viewsId = id && viewsType[id] || {},
                target = targetData.target || viewsId || null;

                for(var i in models){

                    var modelName = models[i], pass = false;
                    pass = modelTrigger(modelName, {
                        modelName : modelName,
                        app : app,
                        prams : prams,
                        target : target,
                        focusedInfo : focusedInfo,
                        viewResult : viewResult
                    }, mEvent);

                    if(pass){
                        break;
                    }

                }

                if(eventType === 'mousemove'){

                    if(beforTest !== target){
                        models = modelsList.mouseon || [];

                        for(var i in models){

                            var modelName = models[i], pass = false;

                            pass = modelTrigger(modelName, {
                                modelName : modelName,
                                app : app,
                                prams : prams,
                                target : target,
                                focusedInfo : focusedInfo,
                                viewResult : viewResult
                            }, 'mouseon');

                            if(pass){
                                break;
                            }

                        }

                    }
                }

            }

            beforTest = target;

        }

        /* 키 이벤트 리스너 */
        window.addEventListener('click', keyEventCallBack);
        window.addEventListener('mousedown', keyEventCallBack);
        window.addEventListener('mouseup', keyEventCallBack);
        window.addEventListener('mouseout', keyEventCallBack);
        window.addEventListener('mousemove', keyEventCallBack);

        // window.addEventListener('mousemove', function(e){
        //     console.log(e);
        // });

        /*
            키 변환 함수
            키 코드를 리모컨 이름에 맞게 변환
        */
        self.keyConvert = function(keyCode){
            switch (keyCode) {
                case 8: {
                    keyCode = 'back';
                    break;
                }
                case 13: {
                    keyCode = 'enter';
                    break;
                }
                case 38: {
                    keyCode = 'arrowUp';
                    break;
                }
                case 40: {
                    keyCode = 'arrowDown';
                    break;
                }
                case 39: {
                    keyCode = 'arrowRight';
                    break;
                }
                case 37: {
                    keyCode = 'arrowLeft';
                    break;
                }
            }

            return keyCode;
        };

        return self;
    };


    modelMgr = function(){

        var self = {},
        loadModels = {},
        models = {}, history = {},
        path = 'js/model';

        self.init = function(datas){
            path = datas.path || 'js/model';
        };

        /* 모델 추가 함수 */
        self.add = function(modelName, modelData){
            models[modelName] = modelData;
        };

        /* 모델 실행 함수 */
        self.trigger = function(modelName, datas, keyEvent){
            var result = false;
            if(typeof models[modelName] === 'function'){
                result = models[modelName](datas, keyEvent);
            }
            return result || false;
        };

        /* 모델 동적 로드 */
        self.load = function(app, array, callback, errFn, require){
            if(!array){ return self};

            // if(require){
            //
            //     if(Array.isArray(array)){
            //         for(var i=array.length-1; i>=0; i--){
            //             if( loadModels[array[i]] ){
            //                 array.splice(i,1);
            //             }
            //         }
            //     }else if(typeof array === 'string'){
            //         if(loadModels[array]){
            //             array = null;
            //         }
            //     }
            //
            // }

            masterObject.loadOn(path, array, '.js', function(check, near,t){

                // if(Array.isArray(array)){
                //     for(var i=array.length-1; i>=0; i--){
                //         loadModels[array[i]] = true;
                //     }
                // }else if(typeof array === 'string'){
                //     loadModels[array] = true;
                // }

                typeof callback === 'function' && callback();
            }, errFn, require);


        };


        return self;
    };


    //네비게이션 컨트롤러
    naviCtrl = {
        get : function(name){
            if(name === '$hash'){
                var hashValue = location.hash, hashLenth = hashValue.length; // scope
                return hashValue.slice(1, hashLenth);
            }
            return navi[name];
        },
        set : function(name, value){
            /*
                @일반 네비와 hash 네비로 나누어 진다.
            */
            var oldNaviVal = oldNavi[name], newNaviVal = navi[name], // old, new 값 scope
                naviWatchesItems = naviWatches[name];

            if(name === '$hash'){ // 아이템 이름이 $hash 라면

                // 최초 이벤트 등록 로직 @ hashchange
                if(!isHashView && newNaviVal === undefined){ // 해쉬뷰 상태가 아니고 newNavi 가 배정이 안되어 있을때..
                    var hashValue = location.hash, hashLenth = hashValue.length; // scope
                    isHashView = true; // 해쉬뷰 상태
                    navi[name] = hashValue.slice(1, hashLenth); //
                    window.addEventListener('hashchange', function(){
                        var hashValue = location.hash, hashLenth = hashValue.length; // scope
                        oldNaviVal = newNaviVal;
                        oldNavi[name] = newNaviVal; // 이전값 등록
                        newNaviVal = hashValue.slice(1, hashLenth);
                        navi[name] = newNaviVal;
                        naviWatchesItems = naviWatches[name];

                        if(naviWatchesItems){
                            for(var i in naviWatchesItems){
                                naviWatchesItems[i](oldNaviVal, newNaviVal); // 각 navi Watches 동작
                            }
                        }
                    });
                }

                if(typeof value === 'function'){ // 함수형이라면
                    var result = value(oldNaviVal); // value의 리턴값으로 결정
                    if(typeof result === 'string'){ // result 가 문자열 이면
                        location.hash = '#'+result;
                    }else{
                        return false;
                    }
                }else if(typeof value === 'string'){ // value가 문자열이면
                    location.hash = '#'+value;
                }else{ // 이도 저도 아니면
                    return false;
                }


            }else{

                // hash가 아닌 일반 네비게이션 등록시
                if(typeof value === 'function'){
                    var result = value(oldNaviVal);

                    if(typeof result !== 'function'){
                        oldNaviVal = newNaviVal;
                        newNaviVal = result;
                    }else{
                        return false;
                    }

                }else {
                    oldNaviVal = newNaviVal;
                    newNaviVal = value;
                }

                oldNavi[name] = oldNaviVal;
                navi[name] = newNaviVal;

                if(naviWatchesItems){
                    for(var i in naviWatchesItems){
                        naviWatchesItems[i](oldNaviVal, newNaviVal);
                    }
                }

            }
            return true;
        },
        watch : function(name, fn){
            var naviWatchesItems = naviWatches[name];

            if(naviWatchesItems){

                //중복 체크
                var j = naviWatchesItems.length - 1;
                for (var i in naviWatchesItems) {
                    if (naviWatchesItems[i] === fn) {
                        return;
                        break;
                    }
                    if (naviWatchesItems[j] === fn) {
                        return;
                        break;
                    }
                    j--;
                }

                naviWatchesItems.push(fn);
            }else{
                naviWatches[name] = [];
                naviWatches[name].push(fn);
            }
        },
        removeWatch : function(name, fn){
            var naviWatchesItems = naviWatches[name];

            if(naviWatchesItems){

                var j = naviWatchesItems.length - 1;
                for (var i in naviWatchesItems) {
                    if (naviWatchesItems[i] === fn) {
                        naviWatchesItems.splice(i, 1);
                        break;
                    }
                    if (naviWatchesItems[j] === fn) {
                        naviWatchesItems.splice(j, 1);
                        break;
                    }
                    j--;
                }

            }
        },
        removeAllWatch : function(name){
            naviWatches[name] = [];
        }
    };

    function setFreeLoadComponent(setPrototype, suc, compoPath, require){

        (function loop(protoItem, loaded){

            if( Array.isArray(protoItem) &&  protoItem.length){

                masterObject.loadOn(compoPath, protoItem, '.js', function(n,c, nameList){
                    for(var i in nameList){
                        loop(nameList[i], true);
                    }
                    suc();
                }, null, require);

            }else if(typeof protoItem === 'string'){

                loaded || masterObject.loadOn(compoPath, [protoItem], '.js', function(n,c, nameList){
                    suc();
                }, null, require);

            }else{
                suc();
            }

        })(setPrototype, false);


    }

    /* 프로토타입 설정 */
    function setComponentPrototype(setPrototype, proto, loadAfter, compoPath, require){

        if(typeof loadAfter === 'function'){

            (function loop(protoItem, lastFn){

                if(!protoItem){
                    lastFn && lastFn();
                }else if(typeof protoItem === 'function'){
                    protoItem(proto);
                    lastFn && lastFn();
                }else if(typeof protoItem === 'object'){

                    if( Array.isArray(protoItem) && protoItem.length > 0){

                        var loadCount = 0, maxCount = protoItem.length;

                        for(var name in protoItem){
                            loop(protoItem[name], function(){
                                if( (++loadCount) >= maxCount ){
                                    lastFn && lastFn();
                                }
                            });
                        }

                    }else{

                        for(var i in protoItem){
                            proto[i] = protoItem[i]
                        }
                        lastFn && lastFn();

                    }

                }else if(typeof protoItem === 'string'){

                    masterObject.loadOn(compoPath, [protoItem], '.js', function(n,c, nameList){

                        var baseProto = baseComponent[protoItem];

                        setComponentPrototype(baseProto.setPrototype, baseProto.fn.prototype, function(){

                            baseProto = baseProto.fn;

                            if(typeof baseProto === 'function'){
                                // console.log(proto);
                                // console.log(baseProto.prototype);
                                baseProto.prototype.appMgr = proto.appMgr;
                                baseProto = new baseProto();
                            }

                            if(typeof baseProto === 'object' && !Array.isArray(baseProto)){
                                for(var i in baseProto){
                                    proto[i] = baseProto[i];
                                }
                            }

                            lastFn && lastFn();

                        }, compoPath, require)

                    }, null, require);

                }

            })(setPrototype, loadAfter);

        }else{

            if(typeof setPrototype === 'function'){
                setPrototype(proto);
            }else if(typeof setPrototype === 'object' && !Array.isArray(setPrototype)){

                for(var i in setPrototype){
                    proto[i] = setPrototype[i]
                }

            }else if( Array.isArray(setPrototype) ){
                for(var i in setPrototype){
                    if( !setComponentPrototype(setPrototype[i], proto) ){
                        return false;
                    }
                }

            }else if(typeof setPrototype === 'string'){

                var baseProto = baseComponent[setPrototype].fn;
                if(typeof baseProto === 'function'){
                    baseProto.prototype.appMgr = proto.appMgr;
                    baseProto = new baseProto();
                }

                if(typeof baseProto === 'object' && !Array.isArray(baseProto)){
                    for(var i in baseProto){
                        proto[i] = baseProto[i];
                    }
                }

            }else{
                return false;
            }

        }

        return true;
    }


    componentGetSet = {
        // get : function(name){
        //     return component[name];
        // },
        // set : function(name, fn){
        //     component[name] = fn;
        // }
        get : function(name, datas){
            if(component[name]){
                setComponentPrototype(component[name].setPrototype, component[name].fn.prototype);
                return new component[name].fn(datas);
            }
            return false;
        },
        set : function(name, setPrototype, fn){
            if(typeof fn === 'function'){
                component[name] = {
                    fn : fn,
                    setPrototype : setPrototype
                };
                // component[name] = fn;
                return true;
                // return setComponentPrototype(setPrototype, component[name].prototype);
            }
            return false;
        },
        getList : function(){
            var result = [];
            for(var i in component){
                result.push(i);
            }
            return result;
        }
    };

    baseComponentGetSet = {
        set : function(name, addBase, fn){
            if(fn){

                if(typeof fn === 'function' || typeof fn === 'object'){
                    baseComponent[name] = {
                        fn : fn,
                        setPrototype : addBase
                    };
                }else{
                    return false;
                }


                return true;
            }
            return false;
        },
        getList : function(){
            var result = [];
            for(var i in baseComponent){
                result.push(i);
            }
            return result;
        }
    };

    ctrlGetSet = {
        get : function(name){
            return ctrl[name];
        },
        set : function(name, fn){
            ctrl[name] = fn;
        },
        add : function(name, fn) {
            ctrl[name] = fn({name : name});
            // ctrl[name] = fn(name, naviCtrl, message, componentGetSet);
        },
        getList : function(fn){
            var result = [];
            for(var i in ctrl){
                result.push(i);
            }
            return result;
        }
    };

    modelGetSet = {
        get : function(name){
            return model[name];
        },
        set : function(name, fn){
            model[name] = fn;
            return model[name];
        },
        add : function(name, fn) {
            model[name] = fn({
                name : name,
                ctrl : ctrl[name]
            });
            // model[name] = fn(name, ctrl[name], naviCtrl, message, componentGetSet);
        },
        getList : function(fn){
            var result = [];
            for(var i in model){
                result.push(i);
            }
            return result;
        }
    };

    viewGetSet = {
        get : function(name){
            return view[name];
        },
        set : function(name, fn){
            view[name] = fn;
        },
        add : function(name, fn) {
            view[name] = fn({name : name,
                ctrl : ctrl[name],
                model : model[name]
            });
            // view[name] = fn(name, ctrl[name], model[name], naviCtrl, message, componentGetSet);
        },
        getList : function(fn){
            var result = [];
            for(var i in view){
                result.push(i);
            }
            return result;
        }
    };

    ppViewGetSet = {
        page : {
            set : function(name, fn, setPrototype){
                if(typeof fn === 'function'){
                    pageView[name] = {
                        fn : fn,
                        setPrototype : setPrototype
                    };

                    return true;
                }
                return false;
            },
            get : function(name, datas){
                if(pageView[name]){
                    setComponentPrototype(pageView[name].setPrototype, pageView[name].fn.prototype);
                    return new pageView[name].fn(datas);
                }
                return false;
            }
        },
        popup : {
            set : function(name, fn){
                if(typeof fn === 'function'){
                    popupView[name] = {
                        fn : fn,
                        setPrototype : setPrototype
                    };

                    return true;
                }
                return false;
            },
            get : function(name){
                if(popupView[name]){
                    setComponentPrototype(popupView[name].setPrototype, popupView[name].fn.prototype);
                    return new popupView[name].fn(datas);
                }
                return false;
            }
        }
    };


    eventModelGetSet = {
        set : function(name, fn){
            if(typeof fn === 'object' && !Array.isArray(fn)){
                eventModel[name] = fn;
            }
        },
        get : function(name){
            return eventModel[name];
        }
    };

    globalsGetSet = {
        variable : {
            get : function(name){
                return globals.variable[name];
            },
            set : function(name, fn){
                globals.variable[name] = fn;
                return true;
            },
            getList : function(fn){
                var result = [];
                for(var i in globals.variable){
                    result.push(i);
                }
                return result;
            }
        },
        array : {
            get : function(name){
                return globals.array[name];
            },
            set : function(name, fn){
                if(Array.isArray(fn)){
                    globals.array[name] = fn;
                    return true;
                }
            },
            getList : function(fn){
                var result = [];
                for(var i in globals.array){
                    result.push(i);
                }
                return result;
            }
        },
        object : {
            get : function(name){
                var result = globals.object[name];

                if(typeof result === 'function'){
                    return result();
                }else{
                    return result;
                }
            },
            set : function(name, fn){
                if(typeof fn === 'object' && !Array.isArray(fn) || typeof fn === 'function'){
                    globals.object[name] = fn;
                    return true;
                }

                return false;
            },
            add : function(name, fn){
                if(typeof fn === 'object' && !Array.isArray(fn)){
                    if(typeof globals.object[name] !== 'object' || Array.isArray(fn)){
                        globals.object[name] = {};
                    }else{
                        return false;
                    }

                    for(var i in fn){
                        globals.object[name][i] = fn[i];
                    }

                    return true;
                }
                return false;
            },
            getList : function(fn){
                var result = [];
                for(var i in globals.object){
                    result.push(i);
                }
                return result;
            }
        },
        function : {
            get : function(name){
                return globals.function[name];
            },
            trigger : function(name, datas){
                return globals.function[name](datas);
            },
            set : function(name, fn){
                if(typeof fn === 'function'){
                    globals.function[name] = fn;
                }
            },
            getList : function(fn){
                var result = [];
                for(var i in globals.function){
                    result.push(i);
                }
                return result;
            }
        },
        instance : {
            get : function(name, datas){
                if(globals.insObject[name]){
                    setComponentPrototype(globals.insObject[name].setPrototype, globals.insObject[name].fn.prototype);
                    return new globals.insObject[name].fn(datas);
                }
                return false;
            },
            set : function(name, fn, setPrototype){
                if(typeof fn === 'function'){
                    globals.insObject[name] = {
                        fn : fn,
                        setPrototype : setPrototype
                    };

                    return true;
                }
                return false;
            },
            getList : function(fn){
                var result = [];
                for(var i in globals.insObject){
                    result.push(i);
                }
                return result;
            }
        }
    };

    function getAppManagerList(appId){
        if(appMgrList[appId]){
            console.log('%c['+appId +'] is Working!', 'color : rgb(180,0,180); font-size : 15; font-weight : 900;');
        }else{
            appMgrList[appId] = new appMgr(appId);
        }
        return appMgrList[appId];
    }

    lo = function(fn){
        if(fn){
            fn(masterObject, getAppManagerList, plugin, util);
        }
        return {
            userCheck : function(suc,fail){ // 지원 여부 체크
                var result = null,
                agent = navigator.userAgent.toLowerCase(),
                name = navigator.appName.toLowerCase();

                if(name.match(/netscape/gi)){
                    if(suc && typeof suc === 'function'){
                        suc(masterObject, getAppManagerList, plugin, util);
                    }
                    result = true;
                }else{ // 인터넷 익스플로어 10 버전 이하
                    if(fail && typeof fail === 'function'){
                        fail();
                    }
                    result = false;
                }

                return result;
            },
            addPlugin : function(name, pluginData){ // 플러그인 추가
                if(!pluginData){return false;}

                if(typeof pluginData === 'object' || typeof pluginData === 'function'){
                    plugin[name] = pluginData;
                    return true;
                }else{
                    return false;
                }
            }
        };
    };

    //마스터 객체
    masterObject = {
        // addCtrl: function(name, fn) {
        //     ctrl[name] = fn(name, naviCtrl, message, componentGetSet);
        // },
        // addModel: function(name, fn) {
        //     model[name] = fn(name, ctrl[name], naviCtrl, message, componentGetSet);
        // },
        // addView: function(name, fn) {
        //     view[name] = fn(name, ctrl[name], model[name], naviCtrl, message, componentGetSet);
        // },
        start: function(path, name, fn, error) {
            if(name){
                if(path){
                    path += '/';
                }
                var p = path + name + '/';
                //console.log(p);
                masterObject.loadOn([p + 'ctrl.js', p + 'model.js', p + 'view.js'], function() {
                    fn ? fn({
                        name : name,
                        ctrl : ctrl[name],
                        model : model[name],
                        view : view[name]
                    }) : null;
                    // fn ? fn(name, ctrl[name], model[name], view[name], naviCtrl, message, componentGetSet) : null;
                }, function() {
                    error ? error() : null;
                    console.error('locationMVM : find no js');
                });
            }else{
                console.error('locationMVM : path to no name js');
            }

        },
        createAppManager : function(appId){
            if(appMgrList[appId]){
                console.error('['+appId +'] is Working!');
            }else{
                appMgrList[appId] = new appMgr();
            }
            return appMgrList[appId];
        },
        appManager : function(){
            // appMgr.prototype.view = viewMgr();
            // appMgr.prototype.model = modelMgr();
            // appMgr.prototype.keyEvent = keyMgr();
            // appMgr.prototype.mouseEvent = mouseMgr();
            // return new appMgr();
        },
        ctrl : ctrlGetSet,
        // getCtrl : function(name){
        //     return ctrl[name];
        // },
        // setCtrl : function(name, fn){
        //  ctrl[name] = fn;
        // },
        model : modelGetSet,
        // getModel : function(name){
        //     return model[name];
        // },
        // setModel : function(name, fn){
        //     model[name] = fn;
        // },
        pageView : ppViewGetSet.page,
        popupView : ppViewGetSet.popup,
        eventModel : eventModelGetSet,
        view : viewGetSet,
        global : globalsGetSet,
        // getView : function(name){
        //     return view[name];
        // },
        // setView : function(name, fn){
        //     view[name] = fn;
        // },
        message : message,
        component : componentGetSet,
        baseComponent : baseComponentGetSet,
        // setComponent : function(name, fn){
        //     component[name] = fn;
        // },
        // getComponent : function(name){
        //     return component[name];
        // },
        navi : naviCtrl,
        loadOn : function(rootpath, list, exp, fn, errfn, requires) {

            rootpath = rootpath || '';
            list = list || null;
            exp = exp || '';
            fn = typeof fn === 'function' ? fn : null;
            errfn = typeof errfn === 'function' ? errfn : null;
            requires = requires || false;


            if(rootpath){
                rootpath += '/';
            }

            var checkOkList = [], nearList = [], nameList = [];

            (function loop(list, rootpath, scpath){

                if(Array.isArray(list)){

                    for(var i in list){
                        loop(list[i], rootpath, scpath);
                    }

                }else if(typeof list === 'string'){
                    checkOkList.push(rootpath + scpath + list + exp);
                    nearList.push(scpath + list);
                    nameList.push(list);

                }else if(typeof list === 'object'){

                    for(var i in list){
                        scpath += i + '/';
                        loop(list[i], rootpath, scpath);
                    }

                }

            })(list, rootpath, '');


            // jsRequireList
            /*필요 변수*/
            var i = 0, mxlength = checkOkList.length, head = document.getElementsByTagName('HEAD')[0];
            /*루프 자기 참조 함수*/
            (function loop() {
                /*obj 선언*/
                var obj = document.createElement('script'), pathName = checkOkList[i++];
                obj.setAttribute('src', pathName);
                obj.setAttribute('charset', 'utf-8');
                obj.setAttribute('type', 'text/javascript');

                if(requires){
                    if(jsRequireList[pathName]){
                        if (i < mxlength) {
                            loop();
                        } else {
                            fn && fn(checkOkList, nearList, nameList);
                        }
                        return false;
                    }
                }
                head.appendChild(obj);
                /*에러*/
                obj.onerror = function(error) {
                    delete jsRequireList[pathName];
                    head.removeChild(obj);
                    errfn && errfn(error);
                };


                /*obj가 로드 완료 후 자기 참조*/
                /*js가 완벽하게 로드 된후 동작*/
                // /*
                obj.onload = function(){
                    jsRequireList[pathName] = true;
                    head.removeChild(obj);
                    if (i < mxlength) {
                        loop();
                    } else {
                        fn && fn(checkOkList, nearList,nameList);
                    }
                };
                // */

            })();


            //
            // var head = document.getElementsByTagName('HEAD')[0];
            //
            // (function loop(list, count) {
            //
            //     if(list.isArray()){
            //         var i = 0, maxLength = list.length;
            //
            //
            //     }else if(typeof list === 'string'){
            //
            //         var obj = document.createElement('script');
            //         obj.setAttribute('src', rootpath+list[i++]);
            //         obj.setAttribute('charset', 'utf-8');
            //         obj.setAttribute('type', 'text/javascript');
            //         head.appendChild(obj);
            //
            //         /*에러*/
            //         obj.onerror = function(error) {
            //             head.removeChild(obj);
            //             if (errfn) {
            //                 errfn(error);
            //             }
            //         };
            //
            //         /*obj가 로드 완료 후 자기 참조*/
            //         /*js가 완벽하게 로드 된후 동작*/
            //         // /*
            //         obj.onload = function(){
            //
            //             head.removeChild(obj);
            //             if (i < mxlength) {
            //                 loop();
            //             } else {
            //                 fn ? fn() : null;
            //                 // fn ? fn( ctrlGetSet, modelGetSet, viewGetSet, naviCtrl, message, componentGetSet ) : null;
            //             }
            //         };
            //
            //
            //     }else if(typeof list === 'object'){
            //
            //     }
            //
            // })(list);

        },
        repeat: function(callback, invtime, time, finishCallback) {

            var checking = true;

            if (invtime != 0) {

                (function go() {
                    var inv = setTimeout(function() {

                        callback(cancelInv);
                        clearTimeout(inv);
                        if (checking) {
                            go();
                        } else {
                            inv = null;
                            checking = null;
                            if (finishCallback) {
                                finishCallback();
                            }
                        }

                    }, invtime);
                })();

                if (time != 0) {
                    var cancelTime = setTimeout(function() {

                        clearTimeout(cancelTime);
                        cancelInv();


                    }, time);
                }


            } else {

                var cancelTime = setTimeout(function() {
                    callback();
                    clearTimeout(cancelTime);

                }, time);

            }

            function cancelInv() {
                checking = false;

            }


        },
        checkImgLoad : function(imgUrl){
            var img = document.createElement('img');
            img.src = imgUrl;
            return img.complete;
        },
        imgLoad : function(args) {
            /*
            ({
            	imgUrlList : 이미지 url, callback : 완료시 콜백, suc: 각 아이템당 로드 성공시 콜백, err: 각 아이템당 로드 실패시 콜백,
            	startTime: 시작 지연시간, oneTime: 각 로드의 시작 지연 시간, timeOut: 타임아웃,
                start : 각 아이템당 온로드 시작시 콜백
            })
            */
            var urlTempArray = [],
                sucTempArray = [],
                errTempArray = [],
                sucStackArray = {},
                errStackArray = {},
                // timeout = null,
                // timeoutList = [],
                sucLength = 0,
                errLenth = 0,
                isStop = false,
                started = args.start,
                suc = args.suc,
                err = args.err,
                isAllFaild = false,
                isOneFaild = false,
                oneTime = typeof args.oneTime === 'number' ? args.oneTime : 1,
                startTime = typeof args.startTime === 'number' ? args.startTime : 1,
                timeOut = args.timeOut || 3000,
                callback = args.callback,
                imgUrlList = args.imgUrlList || [],
                dataForamt =  args.format,
                root = args.root ? args.root + '/' : '',
                maxLength = imgUrlList.length;

            args.stop = function(){
                isStop = true;
                AllLoadEventRemove();
            };

            if (imgUrlList && typeof imgUrlList === 'object' && maxLength > 0) {

                if(startTime > 0){
                    var startTimeOut = setTimeout(function() {
                        // forSystem();
                        timeSystem();

                        clearTimeout(startTimeOut);
                        startTimeOut = null;
                    }, startTime);
                }else{
                    timeSystem();
                }

            } else {
                imgLoad_complateFunc();
            }

            function timeSystem() {

                var i = 0, sto = null, inv = null;

                if(oneTime > 0){
                    if(isStop){
                        return false;
                    }
                    start(i);
                    i++;

                    if (i < maxLength) {

                        inv = setInterval(function() {
                            if(isStop){
                                clearInterval(inv);
                                inv = null;
                                return false;
                            }

                            start(i);
                            i++
                            if (i >= maxLength) {
                                clearInterval(inv);
                                inv = null;
                            }

                        }, oneTime);

                    }

                }else{

                    for(var i in imgUrlList){
                        if(isStop){
                            break;
                        }
                        start(i);
                    }

                }

            }

            function start(count) {

                var imgUrlItem = dataForamt ? imgUrlList[count][dataForamt] : imgUrlList[count],
                item = {};

                if(typeof imgUrlItem === 'object'){
                    if(imgUrlItem.nodeType){
                        item = {
                            loaded: true,
                            url: imgUrlItem.src,
                            imgView: plugin.cdom ? new plugin.cdom(imgUrlItem.cloneNode()) : imgUrlItem.cloneNode(),
                            handler: null,
                            errHandler: null,
                            timeout: null
                        };
                    }else if(imgUrlItem.loaded && imgUrlItem.imgView){
                        var imgView = imgUrlItem.imgView.cloneNode();
                        item = {
                            loaded: imgUrlItem.loaded,
                            url: imgUrlItem.url,
                            imgView: plugin.cdom ? new plugin.cdom(imgView.cloneNode()) : imgView.cloneNode(),
                            handler: null,
                            errHandler: null,
                            timeout: null
                        };
                    }else{
                        item = {
                            loaded: false,
                            url: '',
                            imgView: null,
                            handler: null,
                            errHandler: null,
                            timeout: null
                        };
                    }
                }else{
                    item = {
                        loaded: false,
                        url: root + imgUrlItem,
                        imgView: null,
                        handler: null,
                        errHandler: null,
                        timeout: null
                    };
                }

                urlTempArray.push(item);

                //console.log('----------------'+item.url+'------------------------');
                if(item.url && item.url !== '') { //데이터가 존재하면

                    //타임 아웃
                    // console.error('imgLoad - timeout register -> '+item.url);
                    item.timeout = setTimeout(function() {
                        console.error('imgLoad - timeout! -> '+item.url);
                        // item.imgView.src = '';
                        err && err(item);
                        loadEvent(item, false, count, true);
                    }, timeOut );

                    //이미지 로더 스타터
                    imgLoadStart(item, function(item, isComplete){
                        //isComplete 가 true이면 sync 하게 돌아가는 것을 주의
                        suc && suc(item, isComplete);
                        loadEvent(item, true, count);
                    }, function(item) {
                        err && err(item);
                        loadEvent(item, false, count);
                    });

                } else { //존재안하면
                    // console.error('imgLoad - itemCount: '+ count +'의 url 정보 존재 안함');
                    errLenth++;
                    errStackArray[count] = item;
                    // errTempArray.push(item);
                    isAllReady();
                    // timeoutList.push(null);
                }

            }

            function loadEvent(item, loaded, index, timeoutErr) {
                //console.log('imgLoad - image load ) 이미지 로드 '+loaded+'-이벤트 발생');
                item.loaded = loaded;
                loadEventRemove(item);
                if(loaded){
                    sucStackArray[index] = item;
                    // sucTempArray.push(item);
                    sucLength++; //성공 길이 증가
                }else{
                    delete item.imgView;
                    delete item.$$imgView;
                    // delete item.cdom;
                    errStackArray[index] = item;
                    // errTempArray.push(item);
                    errLenth++;
                }
                clearTimeout(item.timeout);
                delete item.timeout;

                if(timeoutErr){
                    item.timeout = true;
                }

                isAllReady();
            }

            function imgLoad_complateFunc() {
                //console.log('↓↓↓↓↓↓↓↓이미지 로드 시퀀스 완료↓↓↓↓↓↓↓↓');
                //console.log(urlTempArray);
                //console.log('↑↑↑↑↑↑↑↑이미지 로드 시퀀스 완료↑↑↑↑↑↑↑↑');
                for(var i = 0; i<sucLength; i++){
                    var sucItem = sucStackArray[i], errItem = errStackArray[i];
                    if(sucItem){
                        sucTempArray.push(sucItem);
                    }else if(errItem){
                        errTempArray.push(errItem);
                    }
                }

                callback && callback(urlTempArray, {
                    errCount : errLenth,
                    sucCount : sucLength,
                    errResult : errTempArray,
                    sucResult : sucTempArray,
                    maxLength : maxLength
                }, args.option);
                // AllLoadEventRemove(urlTempArray);
                callback = null;
            }

            //이미지 로드 시작
            function imgLoadStart(item, suc, err) {

                if(!item.imgView){
                    if(plugin.cdom){
                        item.imgView = plugin.cdom('img');
                    }else{
                        item.imgView = document.createElement('img');
                    }
                }

                item.imgView.id = '$$' + item.url + '$$';
                // item.imgView.setAttribute('id', );
                item.$$imgView = new masterObject.$$(item.imgView.cloneNode());

                if(!item.imgView.src){
                    item.imgView.src = item.url;
                }

                if(item.imgView.complete){
                    suc && suc(item, true);
                }else{
                    started && started();

                    item.handler = function() {
                        // console.log('imgLoad - one image load success - '+item.url+' - 이미지 로드 성공');
                        suc && suc(item, false);
                    };

                    item.errHandler = function() {
                        //console.log('imgLoad - one image load fail - '+item.url+' - 이미지 로드 실패');
                        err && err(item);
                    };

                    item.imgView.addEventListener('load', item.handler);
                    item.imgView.addEventListener('error', item.errHandler);
                }

            }

            //모두다 로드 되었는지 검사
            function isAllReady() {
                //최대 길이 검사
                if ((sucLength+errLenth) === maxLength) {
                    imgLoad_complateFunc();
                    return true;
                }
                return false;
            }

            //모든 로드 이벤트 삭제
            function AllLoadEventRemove() {
                for (var i in urlTempArray) {
                    var item = urlTempArray[i];
                    loadEventRemove(item);
                    clearTimeout(item.timeout);
                    delete item.timeout;
                }
            }

            function loadEventRemove(item) {
                if(item.imgView){
                    item.imgView.removeEventListener('load', item.handler);
                    delete item.handler;
                    item.imgView.removeEventListener('error', item.errHandler);
                    delete item.errHandler;
                }
            }

            return args;
        },
        imgLoadedComplete : function(maxCount, args){
            var self = this, starter = null,
            timeout = 3000,
            tumTime = 0,
            count = 0,
            resultList = {},
            statusList = {},
            optionList = {};

            if( !(args && typeof args === 'object') ){
                args = {};
            }

            self.setTimeout = function(value){
                timeout = value;
            };

            self.loaded = function(name, root, list, func, options){
                var imgLoadDatas = {};
                imgLoadDatas.root = root;
                imgLoadDatas.imgUrlList = list;
                imgLoadDatas.timeOut = args.timeOut || timeout;
                imgLoadDatas.startTime = typeof args.startTime === 'number' ? args.startTime : 1;
                imgLoadDatas.oneTime = args.oneTime;
                imgLoadDatas.callback = function(result, status, option){
                    if(name){
                        resultList[name] = result;
                        statusList[name] = status;
                        optionList[name] = option;
                    }
                    typeof func === 'function' && func(result, status, option);
                    count++;
                    self.callStarter();
                };

                imgLoadDatas.startTime += tumTime;
                tumTime += args.tumTime;

                if(options && typeof options){
                    for(var i in options){
                        imgLoadDatas[i] = options[i];
                    }
                }

                return masterObject.imgLoad(imgLoadDatas);
            };

            self.starter = function(func, maxValue){
                if(maxValue && typeof maxValue === 'number'){maxCount = maxValue;}
                starter = typeof func === 'function' ? func : null;
                self.callStarter();
            };

            self.setMaxCount = function(value){
                maxCount = value;
            };

            self.init = function(){
                count = 0;
            };

            self.callStarter = function(){
                if(maxCount && count >= maxCount){
                    typeof starter === 'function' && starter(resultList, statusList, optionList);
                    maxCount = 0;
                }
            };
        },
        ajax : function(data){

            var completeState = false, errState = false, sucFn = data.success, errFn = data.error,
            contentType = data.contentType,
            accept = data.accept,
            acceptLanguage = data.acceptLanguage;

            if(!data.url){
                return false;
            }

            try {
                var xhr = null, json = data.json;

                if (window.XMLHttpRequest) {
                    xhr = new XMLHttpRequest();
                } else {
                    xhr = new ActiveXObject("Microsoft.XMLHTTP");
                }

                xhr.timeout = data.timeout || 5000;

                xhr.ontimeout = function(){
                    console.error('timeout!');
                    xhr.onreadystatechange = null;
                    completeState || errFn && errFn('timeout');
                    completeState = true;
                    // data.timeoutcallback && data.timeoutcallback();
                };

                xhr.onreadystatechange = function(){
                    try {
                        if (xhr.readyState === 4) {
                            var status = xhr.status, responseText = xhr.responseText;
                            if (status === 200 || status === 201 || status === 204 || status === 206) {
                                if(json === undefined || json === true){
                                    var result = null;
                                    if(responseText && typeof responseText === 'object'){
                                        result = responseText;
                                    }else{
                                        result = JSON.parse(responseText);
                                    }
                                    completeState || sucFn && sucFn(status, result);
                                }else{
                                    completeState || sucFn && sucFn(status, responseText);
                                }
                                completeState = true;
                            } else {
                                completeState || errFn && errFn(status, responseText);
                                completeState = true;
                            }
                            xhr.onreadystatechange = null;
                        }
                    } catch (e) {
                        console.error(e);
                        xhr.onreadystatechange = null;
                        completeState || errFn && errFn('error', e);
                        completeState = true;
                    }

                };

                var sendData = '';

                if(typeof data.inputData === 'object'){
                    for(var i in data.inputData){
                        sendData += i +'='+data.inputData[i] + '&';
                    }
                    sendData = sendData.replace(/&$/g, '');
                }else if(typeof data.inputData === 'string'){
                    sendData = data.inputData;
                }

                if(data.type !== 'POST'){
                    data.url = data.url + (sendData ? '?' + sendData : '');
                    sendData = null;
                }

                xhr.open(data.type || 'GET', data.url, data.async || true);
                xhr.setRequestHeader('Content-Type', contentType || 'application/x-www-form-urlencoded;application/json;charset=utf-8');
                accept && xhr.setRequestHeader('Accept', accept);
                acceptLanguage && xhr.setRequestHeader('Accept-Language', acceptLanguage);
                xhr.send(sendData);

                return {
                    stop : function(){
                        completeState = true;
                        xhr.onreadystatechange = null;
                    }
                };

            }catch(e){
                console.log(e);
                completeState || errFn && errFn(xhr.status);
                completeState = true;
            }

            return {
                stop : function(){}
            };
        },
        log : function(name, txt, status){ // locationMVM 전용 로그
            if(status === undefined){
                if(model.config && model.config.logView !== undefined){ // config Model에 영향을 받음
                    status = masterObject.getModel('config').logView; // config의 logView에 따라 로그 유무가 결정
                }else{
                    status = true;
                }
            }

            if(status){
                if(txt === undefined){
                    console.log(name);
                }else{
                    console.log(name + ' - ' + txt);
                }
            }
        },
        cookie : function(){
            if(arguments.length === 1 && typeof arguments[0] === 'string'){
                return decodeURIComponent(document.cookie);
            }else if(arguments.length === 2){
                var d = new Date();
                d.setTime(d.getTime() + (1*24*60*60*1000));
                var expires = "expires="+ d.toUTCString();
                document.cookie = arguments[0] + "=" + arguments[1] + ";" + expires + ";path=/";
            }else if(arguments.length === 3){
                var d = new Date();
                d.setTime(d.getTime() + (arguments[2]*24*60*60*1000));
                var expires = "expires="+ d.toUTCString();
                document.cookie = arguments[0] + "=" + arguments[1] + ";" + expires + ";path=/";
            }
        },
        aniFrame : function(){

            var maxTime = null, callback = null, fix = null, stopLoop = false, lastCallback = null, startTime = window.performance.now(), nowtime = 0, stop = true, per = 0, stack = 0,
                arg1 = arguments[0], arg2 = arguments[1], arg3 = arguments[2], arg4 = arguments[3], arg5 = arguments[4], result = null;

            if(arg1){
                if(typeof arg1 === 'number'){
                    maxTime = arg1;
                }else if(typeof arg1 === 'function'){
                    callback = arg1;
                }
            }

            if(arg2){
                if(typeof arg2 === 'number'){
                    maxTime = arg2;
                }else if(typeof arg2 === 'function'){
                    callback = arg2;
                }
            }

            if(arg3){
                if(typeof arg3 === 'number'){
                    fix = arg3;
                }else if(typeof arg3 === 'boolean'){
                    stopLoop = arg3;
                }else if(typeof arg3 === 'function'){
                    lastCallback = arg3;
                }
            }

            if(arg4){
                if(typeof arg4 === 'number'){
                    fix = arg4;
                }else if(typeof arg4 === 'boolean'){
                    stopLoop = arg4;
                }else if(typeof arg4 === 'function'){
                    lastCallback = arg4;
                }
            }

            if(arg5){
                if(typeof arg5 === 'number'){
                    fix = arg5;
                }else if(typeof arg5 === 'boolean'){
                    stopLoop = arg5;
                }else if(typeof arg5 === 'function'){
                    lastCallback = arg5;
                }
            }

            function stopfn(fn){
                if(lastCallback){
                    lastCallback({per : per, maxTime : maxTime, nowtime : nowtime});
                    lastCallback = null;
                }
                if(fn && typeof fn === 'function'){
                    fn({per : per, maxTime : maxTime, nowtime : nowtime, result : result});
                }
                stop = false;
            }

            function stackfn(value){
                return value*per/100;
            }

            if(callback){

                if(maxTime !== undefined || maxTime !== null){

                    (function anistart(){
                        if(stop){
                            nowtime = (window.performance.now() - startTime)/1000;
                            per = 100/maxTime*nowtime;

                            if(maxTime >= nowtime && stopLoop){
                                if(lastCallback){
                                    lastCallback({per : per, maxTime : maxTime, nowtime : nowtime});
                                    lastCallback = null;
                                }
                                stop = false;
                                return false;
                            }

                            result = callback({
                                per : per,
                                stack : stackfn,
                                maxTime : maxTime,
                                time : fix ? Number(nowtime.toFixed(fix)) : nowtime,
                                intTime : parseInt(nowtime),
                                terminate : stopfn,
                                timeReset : function(){
                                    startTime = window.performance.now();
                                },
                                setMaxTime : function(value){
                                    maxTime = value;
                                }
                            });

                            if(stop){
                                window.requestAnimationFrame(anistart);
                            }
                        }
                    })();

                }else{

                    (function anistart(){
                        if(stop){
                            nowtime = (window.performance.now() - startTime)/1000;

                            result = callback(fix ? Number(nowtime.toFixed(fix)) : nowtime, parseInt(nowtime), stopfn,function(){
                                startTime = window.performance.now();
                            });

                            if(stop){
                                window.requestAnimationFrame(anistart);
                            }
                        }
                    })();

                }

            }

            return stopfn;
        },
        /* 애니 프레임의 pool 버전 */
        aniFramePool : {
            setFPS : function(value){
                if(typeof value === 'number'){
                    aniFramePoolFPS = value;
                }
            },
            getFPS : function(){
                return aniFramePoolFPS;
            },
            /* 프레임 풀 동작 시킴 */
            on : function(){
                var self = this;
                if(window.requestAnimationFrame){
                    isAniFramePoolOn = true;

                    if(isAniFramePoolOn && !isAniPlaying && aniFramePoolIndexListLength > 0){
                        isAniPlaying = true;

                        var requestAnimationFrame = window.requestAnimationFrame,
                        fpsTime = Math.round(1000/aniFramePoolFPS), // 30프레임이면 약 33.33 미리초
                        nowTime = Date.now(),
                        startTime = nowTime,
                        oldTime = nowTime,
                        checkTime = 0,
                        tempTime = 0,
                        nowFps = 0;

                        (function frameLoop(isFirst){

                            if(aniFramePoolIndexListLength < 1){ // 이벤트가 존재하지 않으면 동작 멈춤
                                isAniPlaying = false;
                                isAniFramePoolOn = false;
                            }

                            if( isAniFramePoolOn && isAniPlaying){
                                nowTime = Date.now();
                                nowFps = nowTime - oldTime;
                                checkTime = Math.round((nowTime - startTime) / fpsTime);

                                if(!aniFramePoolFPS || isFirst || checkTime > tempTime){
                                    tempTime = checkTime;
                                    oldTime = nowTime;

                                    for(var i=aniFramePoolIndexList.length-1; i>=0; i--){
                                        var item = aniFramePoolList[aniFramePoolIndexList[i]], itemData = item.data, option = item.option,
                                        per = option.per;

                                        // item.isStop 의 default = null
                                        if(item.isStop === true){ // 아이템 단독 동작 STOP
                                            if(item.oldSaveTime === item.saveTime){
                                                item.saveTime = (nowTime - item.saveTimeNow) + item.saveTime;
                                            }
                                            continue;
                                        }else if(item.isStop === false){ // 아이템 단독 동작 START
                                            item.saveTimeNow = nowTime;
                                            item.oldSaveTime = item.saveTime;
                                            item.isStop = null;
                                        }

                                        if(item.startTime === undefined){
                                            item.startTime = nowTime;
                                        }
                                        if(itemData.isFree === true){
                                            itemData.isFree = false;
                                            item.freeFirstTime = nowTime;
                                            item.saveTime = 0;
                                            item.saveTimeNow = 0;
                                            item.oldSaveTime = 0;
                                        }

                                        itemData.timeStamp = nowTime - item.startTime;
                                        itemData.freeStamp = (nowTime - item.saveTimeNow) + item.saveTime - item.freeFirstTime;
                                        itemData.count = Math.round(itemData.freeStamp / fpsTime);
                                        // itemData.fps = aniFramePoolFPS;
                                        // itemData.stack = value*per/100;

                                        if(per){
                                            itemData.timePer = itemData.timeStamp/per;
                                            itemData.freePer = itemData.freeStamp/per;
                                            // itemData.stack = *per/100;
                                        }else{
                                            itemData.timePer = null;
                                            itemData.freePer = null;
                                        }

                                        // 파라메터
                                        // 1 : 시작한 시간, 2: frameData, 3. 전달 인자
                                        item['action'](item.startTime, itemData, item.prams, function(){
                                            self.removeFrame(item.name);
                                        });
                                    }
                                }

                                requestAnimationFrame(function(){
                                    frameLoop(false);
                                });

                            }

                        })(true);

                    }

                }else{ // window.requestAnimationFrame 이 없을때
                    console.log('애니메이션 지원 ERR');
                }
            },
            /* 프레임 풀을 정지 */
            off : function(eventName){
                if(isAniFramePoolOn){
                    isAniFramePoolOn = false;
                    isAniPlaying = false;
                }
            },
            eventStart : function(eventName){
                if(eventName){
                    aniFramePoolList[aniFramePoolStackList[eventName]].isStop = false;
                }
            },
            eventStop : function(eventName){
                if(eventName){
                    aniFramePoolList[aniFramePoolStackList[eventName]].isStop = true;
                }
            },
            isWorked : function(){
                return isAniFramePoolOn;
            },
            checkFrameName : function(name){
                return aniFramePoolStackList[name];
            },
            isList : function(){
                return aniFramePoolIndexListLength > 0 ? true : false;
            },
            getStackList : function(){
                return aniFramePoolIndexList;
            },
            getNameList : function(){
                return Object.keys(aniFramePoolStackList);
            },
            addFrame : function(name, actionFn, option, initPrams){
                var self = this;
                // aniFramePoolObj
                // aniFramePoolList
                if(typeof name === 'string' && !aniFramePoolStackList[name] && typeof actionFn === 'function'){
                    option = option && typeof option === 'object' ? option : {};
                    initPrams = typeof initPrams === 'object' ? initPrams : {};
                    aniFramePoolStackLength++; // 스택 인덱스 증가

                    aniFramePoolList[aniFramePoolStackLength] = {isStop : null, name : name, action : actionFn, data : {isFree : true}, prams : initPrams, option : option, saveTime : 0, saveTimeNow : 0, oldSaveTime : 0, nowTime : 0}; // 트리거 저장
                    aniFramePoolStackList[name] = aniFramePoolStackLength; // 대조용

                    aniFramePoolIndexList = Object.keys(aniFramePoolList);
                    aniFramePoolIndexListLength = aniFramePoolIndexList.length;

                    return aniFramePoolList[aniFramePoolStackLength].data;
                }
            },
            removeFrame : function(name){
                if(typeof name === 'string' && aniFramePoolStackList[name]){
                    delete aniFramePoolList[aniFramePoolStackList[name]];
                    delete aniFramePoolStackList[name];
                    aniFramePoolIndexList = Object.keys(aniFramePoolList);
                    aniFramePoolIndexListLength = aniFramePoolIndexList.length;
                }else if(name === undefined || name === null){
                    aniFramePoolStackList = {};
                    aniFramePoolList = {};
                    aniFramePoolIndexList = Object.keys(aniFramePoolList);
                    aniFramePoolIndexListLength = aniFramePoolIndexList.length;
                }
            }
        },
        asyncFor : function(obj, callback, options){

            // if( !(obj && (typeof obj === 'object' || typeof obj === 'number') && typeof callback === 'function') ){
            //     return false;
            // }

            if( !options || typeof options !== 'object'){
                options = {};
            }

            var index = 0, lastIndex = 0, inv = null, keys = null, type = 'array',
            endCallback = options.endCallback, backward = options.backward, time = options.time,
            minIndex = 0, maxIndex = 0,
            syncMode = options.sync || false,
            stop = false;

            if(Array.isArray(obj)){
                type = 'array';
                lastIndex = obj.length-1;
                // if(backward === true){
                //     index = lastIndex;
                // }
                keys = obj;
            }else if(obj !== null && typeof obj === 'object'){
                type = 'object';
                keys = Object.keys(obj);
                lastIndex = keys.length-1;
            }else if(typeof obj === 'number'){
                type = 'number';
                lastIndex = obj-1;
                // if(backward === true){
                //     index = lastIndex;
                // }
                keys = [];
                keys.length = obj;
            }else if(obj === null || obj === undefined){
                type = 'number';
                keys = [];
                keys.length = options.max+1;
            }

            minIndex = options.min || index;
            maxIndex = options.max || lastIndex;


            if( !(keys && keys.length > 0) ){
                typeof endCallback === 'function' && endCallback(keys.length);
                return false;
            }

            if((type === 'array' || type === 'number') && backward){

                if(syncMode){

                    for(var i = maxIndex; i>=minIndex; i--){
                        if(callback(i, keys[i])){ break; }
                    }
                    typeof endCallback === 'function' && endCallback();

                }else{

                    (function loop(){
                        if(!callback(maxIndex, keys[maxIndex])){
                            maxIndex--;
                            if(maxIndex >= minIndex){
                                window.requestAnimationFrame(loop);
                            }else{
                                typeof endCallback === 'function' && endCallback();
                            }
                        }else{
                            typeof endCallback === 'function' && endCallback();
                        }
                    })();

                }

            }else if((type === 'array' || type === 'number')){

                if(syncMode){

                    for(var i = minIndex; i<=maxIndex; i++){
                        if(callback(i, keys[i])){ break; }
                    }
                    typeof endCallback === 'function' && endCallback();

                }else{

                    (function loop(){
                        if(!callback(minIndex, keys[minIndex])){
                            minIndex++;
                            if(minIndex <= maxIndex){
                                window.requestAnimationFrame(loop);
                            }else{
                                typeof endCallback === 'function' && endCallback();
                            }
                        }else{
                            typeof endCallback === 'function' && endCallback();
                        }
                    })();

                }

            }else{

                if(syncMode){

                    for(var i = 0; i<=maxIndex; i++){
                        var keyName = keys[i];
                        if( callback(keyName, keyName && obj[keyName]) ){ break; }
                    }
                    typeof endCallback === 'function' && endCallback();

                }else{

                    (function loop(){
                        var keyName = keys[minIndex];
                        if(!callback(keyName, obj[keyName])){
                            minIndex++;
                            if(minIndex <= maxIndex){
                                window.requestAnimationFrame(loop);
                            }else{
                                typeof endCallback === 'function' && endCallback();
                            }
                        }else{
                            typeof endCallback === 'function' && endCallback();
                        }
                    })();

                }

            }

        },
        $$ : function(value){ // 간이 element util
            var self = this,
            element = null, // 요소 객체 저장 변수
            redo = null,
            classId = null, // #(아이디), .(클래스) 분간 정규식
            /* 리사이즈 콜백 정보 */
            call_resizeLength = 0,
            call_resizeIndexLength = 0,
            call_resizeStack = {},
            call_resizeList = {},
            call_resizeIndex = [],
            /* xy 좌표 변경 콜백 정보 */
            call_positionLength = 0,
            call_positionIndexLength = 0,
            call_positionStack = {},
            call_positionList = {},
            call_positionIndex = [];


            if(typeof value === 'object' && value.nodeType === 1){ // 오브젝트이고 element 일때
                element = value;
            } else if(typeof value === 'string'){ // 문자열 일때

                redo = value.match(/^\#|^\./g),
                redo = redo ? redo[0] : undefined;

                if(!redo){ // 정규식으로 걸러진것이 없다면
                    if(value.match(/body|html/gi)){ // 문자열이 body 라면
                        element = document.getElementsByTagName(value)[0]; // body 요소 저장
                    }else if(value.match(/svg|SVG/gi)){
                        element = document.createElementNS("http://www.w3.org/2000/svg", value); // body 요소 저장
                    }else{
                        element = document.createElement(value);
                    }
                }else{
                    classId = value.replace(redo, '');
                    if(redo === '#'){ // 아이디로 구분
                        element = document.getElementById( classId );
                    }else if(redo === '.'){ // 클래스로 구분
                        element = document.getElementsByClassName( classId ); // 배열로 반환된다.
                        element.$$isClass$$ = true;
                    }
                }
            }

            if(!element){ // 막얀 반환된 요소가 존재하지 않는다면 이것으로 끝
                self.$$is$$ = false;
                return null;
            }


            function getElement(){
                if(redo && redo === '.'){ // 클래스인 경우에는 계속해서 검색 반환 되어야 한다.
                    element = document.getElementsByClassName( classId );
                    element.$$isClass$$ = true;
                }
                return element; // 순수 요소 또는 요소의 배열을 반환
            }

            self.imgLoadInfo = {
                img : null, timeout : null
            };
            self.getElement = getElement;
            self.getParent = function(){
                var el = getElement(), result = null;
                if(el.$$isClass$$){ // 배열로 이루어진 요소라면..
                    result = [];
                    for(var i = 0; i<el.length; i++){
                        result.push(el[i].parentNode);
                    }
                    result.$$isParents$$ = true;
                    // 각 배열의 요소 순서로 각 요소의 부모를 배열로 반환
                }else{ // 단일 요소라면...
                    result = el.parentNode || undefined;
                    if(result){
                        result.$$isParent$$ = true;
                    }
                    // 해당 요소의 자식을 반환
                }
                return result; // 각 배열의 요소 순서로 각 요소의 부모를 배열로 반환
            };
            self.getChildren = function(){
                var el = self.getElement(), result = [];
                if(el.$$isClass$$){ // 배열로 이루어진 요소라면..
                    for(var i in el){
                        result.push(el[i].children);
                    }
                    result.$$isChildren$$ = true;
                    return result; // 각 배열의 요소 순서로 각 요소의 자식을 배열로 반환
                }else{ // 단일 요소라면...
                    result = el.children;
                    result.$$isChilds$$ = true;
                    return result; // 해당 요소의 자식을 반환
                }
            };
            self.events = {};

            self.resize = function(name, fn){
                if(typeof fn !== 'function'){
                    return false;
                }
                call_resizeStack[call_resizeLength] = {name : name, fn : fn, datas : {}};
                call_resizeList[name] = call_resizeLength;
                call_resizeLength++;
                Call_resizeIndexSet();
            };

            self.triggerResize = function(name, beforeData, newData){

                if(name){
                    var resizeItem = call_resizeStack[call_resizeList[name]];
                    resizeItem.fn(resizeItem.name, resizeItem.datas, beforeData, newData);
                }else{
                    for(var i = 0; i<call_resizeIndexLength; i++){
                        var resizeItem = call_resizeStack[call_resizeIndex[i]];
                        resizeItem.fn(resizeItem.name, resizeItem.datas, beforeData, newData);
                    }
                }

            };

            self.getResizeList = function(){
                return Object.keys(call_resizeList);
            };

            self.removeResize = function(name){
                if(name){
                    delete call_resizeStack[call_resizeList[name]];
                    delete call_resizeList[name];
                    Call_resizeIndexSet();
                }else{
                    call_resizeStack = {};
                    call_resizeList = {};
                    call_resizeIndex = [];
                    call_resizeIndexLength = 0;
                }
            };

            function Call_resizeIndexSet(){
                call_resizeIndex = Object.keys(call_resizeStack);
                call_resizeIndexLength = call_resizeIndex.length;
            }

            /* XY(position) 변경 콜백 함수 추가 */
            self.onPosition = function(name, fn){
                if(typeof fn !== 'function'){
                    return false;
                }
                call_positionStack[call_positionLength] = {name : name, fn : fn, datas : {}};
                call_positionList[name] = call_positionLength;
                call_positionLength++;
                Call_positionIndexSet();
            };

            self.triggerOnPosition = function(name, beforeData, newData){

                if(name){
                    var positionItem = call_positionStack[call_positionList[name]];
                    positionItem.fn(positionItem.name, positionItem.datas, beforeData, newData);
                }else{
                    for(var i = 0; i<call_positionIndexLength; i++){
                        var positionItem = call_positionStack[call_positionIndex[i]];
                        positionItem.fn(positionItem.name, positionItem.datas, beforeData, newData);
                    }
                }

            };

            self.getOnPositionList = function(){
                return Object.keys(call_positionList);
            };

            self.removeOnPosition = function(name){
                if(name){
                    delete call_positionStack[call_positionList[name]];
                    delete call_positionList[name];
                    Call_positionIndexSet();
                }else{
                    call_positionStack = {};
                    call_positionList = {};
                    call_positionIndex = [];
                    call_positionIndexLength = 0;
                }
            };

            function Call_positionIndexSet(){
                call_positionIndex = Object.keys(call_positionStack);
                call_positionIndexLength = call_positionIndex.length;
            }

        },
        /* 웹 워커 */
        thread : function(threadPath){
            if(!(window && window.Worker)){ return false; }
            var self = this,
            worker = new window.Worker(threadPath);

            /* 받는 메세지 */
            self.on = function(callFn){
                worker.onmessage = callFn;
            };
            /* 메세지 보내기 */
            self.toss = function(data){
                worker.postMessage(data);
            };
            /* 닫기 */
            self.close = function(){
                worker.terminate();
                worker = null;
            };
        },
        /* 난수 범위 생성 */
        getRandom : function(min, max){
            return Math.floor(Math.random() * (max-min) + min);
        }
    };

    var $$ = masterObject.$$.prototype;

    $$.test = function(){
        console.log(this);
    };
    $$.$$is$$ = true; // lo 객체의 타입 결정문
    $$.setMouseEventData = function(eventData){
        var el = this.getElement();
        el.$$mouseEventData = eventData;
    };
    $$.append = function(){
        var arg = arguments, el = this.getElement();

        if(el.length && el.length > 0){
            el = el[el.length-1];
        }

        (function loop(childs){ // 탐색 루프
            if(typeof childs === 'object'){ // 해당 자식이 배열이라면..

                if(childs.$$isClass$$){ // getElementsByTagName으로 만든것일때.
                    for(var i=0; i<childs.length; i++){
                        (function(i){
                            loop(childs[0]); // 탐색
                        })(i);
                    }
                }else if(childs.$$is$$){
                    loop(childs.getElement()); // 탐색
                }else if(childs.nodeType === 1 || childs.nodeType === 3){
                    el.appendChild(childs);
                }else{
                    for(var i in childs){
                        loop(childs[i]); // 탐색
                    }
                }
            }

        })(arg);

        return this;
    };
    $$.appendTo = function(parent){
        var el = this.getElement();
        if(parent){
            if(parent.append){
                parent.append(el);
            }else{
                parent.appendChild(el);
            }
        }

        return this;
    };
    $$.prepend = function(child, oldChild){
        var el = this.getElement();

        if(child.$$is$$){
            child = child.getElement();
        }

        if(oldChild.$$is$$){
            oldChild = oldChild.getElement();
        }

        if(!el.$$isClass$$){
            if(typeof oldChild === 'number'){
                el.insertBefore(child, el.children[oldChild]);
            }else{
                el.insertBefore(child, oldChild);
            }
        }

        return this;
    };
    $$.clone = function(){
        var el = this.getElement();
        return new masterObject.$$(el.cloneNode());
    };
    $$.replace = function(newChild, oldChild){
        var el = this.getElement();

        if(child.$$is$$){
            newChild = child.getElement();
        }

        if(oldChild.$$is$$){
            oldChild = oldChild.getElement();
        }

        if(!el.$$isClass$$){
            if(typeof oldChild === 'number'){
                el.replaceChild(newChild, el.children[oldChild]);
            }else{
                el.replaceChild(newChild, oldChild);
            }
        }

        return this;
    };
    $$.remove = function(){
        var el = this.getElement();
        if(el.$$isClass$$){ // 클래스 자식이면..
            for(var i = el.length-1; i>=0; i--){
                if(el[i].parentNode){
                    el[i].parentNode.removeChild(el[i]);
                }
            }
        }else{
            if(el.parentNode){
                el.parentNode.removeChild(el);
            }
        }

        return this;
    };
    $$.removeChild = function(){ // 자식 삭제
        var masterEl = this.getElement(), arg = arguments;
        (function loop(el, childs){ // 탐색 루프
            if(childs && childs.length){ // 해당 자식이 배열이라면..

                if(el.$$isClass$$){ // 클래스 배열이면..
                    for(var i = el.length-1; i>=0; i--){
                        loop(el[i], childs);
                    }
                }else{ // 단일 요소 이면..
                    for(var j = childs.length-1; j>=0; j--){
                        var chd = childs[j];
                        if(chd.$$is$$){ // 해당 인자가 lo 객체이면
                            // loop(chd.getElement());
                            if(el.contains(chd.getElement())){
                                el.removeChild(chd.getElement());
                            }
                        }else if(chd.nodeType === 1){ // 순수 요소 이면
                            el.removeChild(chd);
                        }
                    }
                }

            }else{
                if(el.$$isClass$$){ // 클래스 배열이면..
                    for(var i = el.length-1; i>=0; i--){
                        loop(el[i]);
                    }
                }else{ // 단일 요소 이면..

                    var chd = el.childNodes;
                    for(var i = chd.length-1; i>=0; i--){
                        el.removeChild(chd[i]);
                    }
                }

            }
        })(masterEl, arg);

        return this;
    };
    /* 스트링 분석 */
    function stringAnalyz(el, pr, data){

        var el = el || {}, pr = pr || {},
        w = el.offsetWidth || 0, h = el.offsetHeight || 0,
        x = el.offsetLeft || 0, y = el.offsetTop || 0,
        pw = pr.offsetWidth || 0, ph = pr.offsetHeight || 0,
        px = pr.offsetLeft || 0, py = pr.offsetTop || 0,
        scrw = el.scrollWidth || 0, scrh = el.scrollHeight || 0,
        scrx = el.scrollLeft || 0, scry = el.scrollTop || 0,
        pscrw = pr.scrollWidth || 0, pscrh = pr.scrollHeight || 0,
        pscrx = pr.scrollLeft || 0, pscry = pr.scrollTop || 0,
        ww = window.innerWidth || 0, wh = window.innerHeight || 0;

        if(typeof data === 'string' && !data.match(/\%/gi)){
            var result = eval(data);
            return typeof result === 'number' ? result : 0;
        }
        return data;
    }
    $$.css = function(){
        var el = this.getElement(), arg = arguments, self = this, result = null;

        result = (function loop(el){ // 탐색 루프
            if(arg.length == 1){

                if(el.$$isClass$$){

                    if(typeof arg[0] === 'string'){
                        var check = arg[0].match(/left|top|width|height|fontSize/g), result = [];
                        for(var i = 0; i<el.length; i++){
                            var value = el[i].style[arg[0]];
                            // result.push(check ? parseInt(value) : value);
                            result.push(check ? Number(value) : value);
                        }
                        return result;
                    }

                    for(var i = 0; i<el.length; i++){
                        loop(el[i]);
                    }
                }else{

                    if(typeof arg[0] === 'string'){
                        var check = arg[0].match(/^left|^top|^width|^height|^fontSize|^lineHeight|^line-height/gi);
                        // return check ? parseInt(el.style[arg[0]]) : el.style[arg[0]];
                        return check ? Number(el.style[arg[0]].replace(/\D/gi,'')) : el.style[arg[0]];
                    }

                    var style = arg[0];
                    for(var i in style){
                        var check = i.match(/left|top|width|height|fontSize/g);
                        if(check && typeof style[i] === 'number'){
                            // style[i] = parseInt(style[i]) + 'px';
                            style[i] = Number(style[i]) + 'px';
                        }
                        el.style[i] = style[i];
                    }
                }

            } else if(arg.length == 2){
                if(el.$$isClass$$){
                    for(var i = 0; i<el.length; i++){
                        loop(el[i]);
                    }
                }else{
                    var styleName = arg[0], style = arg[1],
                    check = styleName.match(/left|top|width|height|fontSize/g);
                    if(check && typeof style === 'number'){
                        // style = parseInt(style) + 'px';
                        style = Number(style) + 'px';
                    }
                    el.style[styleName] = style;
                }

            }

            return self;

        })(el);

        return result;
    };
    $$.center = function(){ // 중앙 정렬 메서드

        var self = this, el = self.getElement(), pr = self.getParent(), arg = arguments,
        maxLength = arg.length, arg1 = arg[0], arg2 = arg[1];

        (function loop(el){ // 탐색 루프

            if(el.$$isClass$$){ // 배열
                for(var i = 0; i<el.length; i++){
                    loop(el[i]);
                }
            }else{ // 순수 요소

                var parent = el.parentNode;

                if(!parent){
                    return false;
                }

                var pWidth = parent.offsetWidth || 0, pHeight = parent.offsetHeight || 0,
                    cWidth = el.offsetWidth || 0, cHeight = el.offsetHeight || 0;

                if(maxLength === 0 || arg1 === undefined || arg1 === null){
                    self.setLT(pWidth/2 - cWidth/2, pHeight/2 - cHeight/2);
                }else {

                    if(arg1 === 'w' || arg1 === 'width'){
                        var merge = arg2 ? stringAnalyz(el, parent, arg2) : 0;
                        self.setLeft(pWidth/2 - cWidth/2 + merge);
                    }else if(arg1 === 'h' || arg1 === 'height'){
                        var merge = arg2 ? stringAnalyz(el, parent, arg2) : 0;
                        self.setTop(pHeight/2 - cHeight/2 + merge);
                    }else{
                        var merge1 = arg1 ? stringAnalyz(el, parent, arg1) : 0,
                        merge2 = arg2 ? stringAnalyz(el, parent, arg2) : 0;
                        self.setLT(pWidth/2 - cWidth/2 + merge1, pHeight/2 - cHeight/2 + merge2);
                    }

                }

            }

        })(el);

        return self;
    };
    $$.attr = function(){

        var el = this.getElement(), arg = arguments, self = this, result = null;

        result = (function loop(el){ // 탐색 루프
            if(arg.length == 1){

                if(el.$$isClass$$){

                    if(typeof arg[0] === 'string'){
                        var check = arg[0].match(/left|top|width|height|fontSize/g), result = [];
                        for(var i = 0; i<el.length; i++){
                            result.push(el[i].getAttribute(arg[0]));
                        }
                        return result;
                    }

                    for(var i = 0; i<el.length; i++){
                        loop(el[i]);
                    }
                }else{

                    if(typeof arg[0] === 'string'){
                        var check = arg[0].match(/left|top|width|height|fontSize/g);
                        return el.getAttribute(arg[0]);
                    }

                    var attr = arg[0];
                    for(var i in attr){
                        el.setAttribute(i, attr[i]);
                    }
                }

            } else if(arg.length == 2){
                if(el.$$isClass$$){
                    for(var i = 0; i<el.length; i++){
                        loop(el[i]);
                    }
                }else{
                    var attrName = arg[0], attr = arg[1];
                    el.setAttribute(attrName, attr);
                }
            }

            return self;

        })(el);

        return result;

    };
    $$.imgNull = function(){
        var self = this, el = this.getElement();

        if(el.nodeName === 'IMG'){
            el.setAttribute('src', '');
        }else{
            el.style.backgroundImage = 'none';
        }

        return self;
    };
    $$.imgLoadInfoFree = function(){
        var self = this, imgLoadInfo = self.imgLoadInfo;

        if(imgLoadInfo){
            if(imgLoadInfo.img){
                imgLoadInfo.img.onload = null;
                imgLoadInfo.img.onerror = null;
            }
            if(imgLoadInfo.timeout){
                clearTimeout(imgLoadInfo.timeout);
                imgLoadInfo.timeout = null;
            }

        }
        return self;
    };
    $$.setImg = function(){

        var self = this, el = this.getElement(), arg = arguments, count = 1, dim = false, time = 5000, imgLoadInfo = self.imgLoadInfo;

        self.imgLoadInfoFree();

        if(arg[count] && typeof arg[count] === 'boolean'){
            dim = arg[count];
            count++;
        }

        if(arg[count] && typeof arg[count] === 'number'){
            time = arg[count];
            count++;
        }

        (function loop(el){ // 탐색 루프

            if(el.$$isClass$$){ // 배열..

                for(var i = 0; i<el.length; i++){
                    loop(el[i]);
                }

            }else{ // 단일 요소 ..

                var imgUrl = arg[0], suc = arg[count], fail = arg[count+1];


                if(imgUrl && typeof imgUrl === 'string'){


                    if(dim){ // 성공하면 이미지 뜨게
                        imgLoadInfo.img = document.createElement('img');
                        if(el.nodeName === 'IMG'){
                            el.setAttribute('src', '');
                        }else{
                            el.style.backgroundSize = '100% 100%';
                            el.style.backgroundImage = 'none';
                        }
                    }else{ // 이미지 로드되는 과정을 똑같이 보이게
                        if(el.nodeName === 'IMG'){
                            imgLoadInfo.img = el;
                        }else{
                            imgLoadInfo.img = document.createElement('img');
                            el.style.backgroundSize = '100% 100%';
                            el.style.backgroundImage = 'url('+imgUrl+')';
                        }
                    }

                    imgLoadInfo.img.setAttribute('src', imgUrl);

                    if(imgLoadInfo.img.complete){

                        if(el.nodeName === 'IMG'){
                            el.setAttribute('src', imgUrl);
                        }else{
                            el.style.backgroundImage = 'url('+imgUrl+')';
                        }

                        if(suc){
                            suc(el, true);
                        }

                        self.imgLoadInfoFree();

                    }else{

                        imgLoadInfo.img.onload = function(){


                            if(el.nodeName === 'IMG'){
                                el.setAttribute('src', imgUrl);
                            }else{
                                el.style.backgroundImage = 'url('+imgUrl+')';
                            }

                            if(suc){
                                suc(el, false);
                            }

                            self.imgLoadInfoFree();

                        };

                        imgLoadInfo.img.onerror = function(){

                            // if(el.nodeName === 'IMG'){
                            //     el.setAttribute('src', '');
                            // }else{
                            //     el.style.backgroundImage = 'none';
                            // }
                            self.imgNull().imgLoadInfoFree();

                            if(fail){
                                fail(el, false);
                            }


                        };

                        imgLoadInfo.timeout = setTimeout(function(){
                            self.imgNull().imgLoadInfoFree();

                            if(fail){
                                fail(el, false);
                            }
                        }, time);

                    }



                    // console.log(imgLoadInfo);

                }else{

                    self.imgNull().imgLoadInfoFree();
                    if(fail){
                        fail(el, false);
                    }
                }


            }

        })(el);

        return self;
    };
    $$.static = function(){
        this.css('position','static');
        return this;
    };
    $$.absolute = function(){
        this.css('position','absolute');
        return this;
    };
    $$.abs = function(){
        this.css('position','absolute');
        return this;
    };
    $$.relative = function(){
        this.css('position','relative');
        return this;
    };
    $$.fixed = function(){
        this.css('position','fixed');
        return this;
    };
    $$.setOverflow = function(value){
        if(value){
            this.css('overflow', value);
        }else{
            this.css('overflow', 'visible');
        }
        return this;
    };
    $$.hide = function(){
        this.css('visibility','hidden');
        return this;
    };
    $$.show = function(){
        this.css('visibility','visible');
        return this;
    };
    $$.cursor = function(value){
        if(value){
            this.css('cursor',value);
        }else{
            this.css('cursor', 'auto');
        }
        return this;
    };
    $$.setId = function(){
        this.attr('id',arguments[0]);
        return this;
    };
    $$.getId = function(){
        return this.attr('id');
    };
    $$.getValue = function(){
        return this.getElement().value;
    };
    $$.setValue = function(value){
        this.getElement().value = value;
        return this;
    };
    $$.setLeft = function(left, resize, oldValue){
        var el = this.getElement(), pr = this.getParent(),
        old = oldValue || this.getLeft(),
        result = stringAnalyz(el, pr, left);

        this.css('left', result);

        if(resize){
            return {oldValue : old, newValue : result};
        }else{
            this.triggerOnPosition(null, {left : old}, {left : result});
            return this;
        }
    };
    $$.setX = $$.setLeft;
    $$.addLeft = function(left, resize){
        var el = this.getElement(), pr = this.getParent(), old = this.getLeft();
        return this.setLeft(old + stringAnalyz(el,pr,left), resize, old);
    };
    $$.addX = $$.addLeft;
    $$.setTop = function(top, resize, oldValue){
        var el = this.getElement(), pr = this.getParent(),
        old = oldValue || this.getTop(),
        result = stringAnalyz(el, pr, top);

        this.css('top', result);

        if(resize){
            return {oldValue : old, newValue : result};
        }else{
            this.triggerOnPosition(null, {top : old}, {top : result});
            return this;
        }
    };
    $$.setY = $$.setTop;
    $$.addTop = function(top, resize){
        var el = this.getElement(), pr = this.getParent(), old = this.getTop();
        return this.setTop(old + stringAnalyz(el,pr,top), resize, old);
    };
    $$.addY = $$.addTop;
    $$.setLT = function(left, top){
        var leftValue = this.setLeft(left, true), topValue = this.setTop(top, true);
        this.triggerOnPosition(null, {
            left : leftValue.oldValue,
            top : topValue.oldValue
        }, {
            left : leftValue.newValue,
            top : topValue.newValue
        });
        return this;
    };
    $$.setXY = $$.setLT;
    $$.addLT = function(left, top){
        var leftValue = this.addLeft(left, true), topValue = this.addTop(top, true);
        this.triggerOnPosition(null, {
            left : leftValue.oldValue,
            top : topValue.oldValue
        }, {
            left : leftValue.newValue,
            top : topValue.newValue
        });
        return this;
    };
    $$.addXY = $$.addLT;
    /*xy 좌표를 오른쪽 기준으로 잡음*/
    $$.setRight = function(x, resize){
        var el = this.getElement(), pr = this.getParent(), width = this.getWidth(),
        old = this.getRight();
        result = null, changeValue = null;
        x = typeof x === 'number' ? (x < 0 ? -x : '-' + x) : (x.match(/^\-/gi) ? x.replace(/^\-/gi,'') : '-' + x );

        result = stringAnalyz(el, pr, 'pw+' + x ) - width;
        changeValue = this.setLeft( result, true);

        if(resize){
            return changeValue;
        }else{
            this.triggerOnPosition(null, {right : old}, {right : result});
            return this;
        }
        return this;
    };
    $$.setR = $$.setRight;
    $$.addRight = function(right){
        var el = this.getElement(), pr = this.getParent(), old = this.getRight();
        this.setRight(old + stringAnalyz(el,pr,right));
        return this;
    };
    $$.setBottom = function(y){
        var el = this.getElement(), pr = this.getParent(), height = this.getHeight();
        // this.setTop( stringAnalyz(el, pr, y) - height);
        y = typeof y === 'number' ? (y < 0 ? -y : '-' + y) : ( y.match(/^\-/gi) ? y.replace(/^\-/gi,'') : '-' + y );
        this.setTop( stringAnalyz(el, pr, 'ph+' + y ) - height );
        return this;
    };
    $$.setB = $$.setBottom;
    $$.addBottom = function(bottom){
        var el = this.getElement(), pr = this.getParent(), old = this.getBottom();
        this.setBottom(old + stringAnalyz(el,pr,bottom));
        return this;
    };
    $$.setRB = function(x,y){
        this.setRight(x);
        this.setBottom(y);
        return this;
    };
    $$.layoutTo = function(wType, hType, margin){
        margin = margin || [0,0];
        var x = margin[0], y = margin[1];
        switch (wType) {
            case 'left':{
                this.setLeft(x);
                break;
            }
            case 'center':{
                this.center('w', x);
                break;
            }
            case 'right':{
                this.setRight(x);
                break;
            }
        }

        switch (hType) {
            case 'top':{
                this.setTop(y);
                break;
            }
            case 'middle':{
                this.center('h', y);
                break;
            }
            case 'bottom':{
                this.setBottom(y);
                break;
            }
        }
        return this;
    };
    $$.getLeft = function(){
        return this.getElement().offsetLeft;
    };
    $$.getX = $$.getLeft;
    $$.getTop = function(){
        return this.getElement().offsetTop;
    };
    $$.getY = $$.getTop;
    $$.getRight = function(){
        var el = this.getElement(), left = el.offsetLeft, width = el.offsetWidth;
        return left + width;
    };
    $$.getBottom = function(){
        var el = this.getElement(), top = el.offsetTop, height = el.offsetHeight;
        return top + height;
    };
    $$.getCentral = function(type){
        var el = this.getElement(), left = el.offsetLeft, width = el.offsetWidth, top = el.offsetTop, height = el.offsetHeight;
        if(type === 'center'){
            return left + (width/2);
        }else if(type === 'middle'){
            return top + (height/2);
        }else{
            return [left + (width/2), top + (height/2)];
        }
    };
    $$.setPerXY = function(left, top){
        this.css({left: left+'%', top: top+'%'});
        return this;
    };
    $$.setPerX = function(left){
        this.css('left', left+'%');
        return this;
    };
    $$.setPerY = function(top){
        this.css('top', top+'%');
        return this;
    };
    $$.setWidth = function(width, resize, addOld){
        var el = this.getElement(), pr = this.getParent(),
        old = addOld || this.getWidth(),
        result = stringAnalyz(el, pr, width);

        this.css('width', result);
        if(resize){
            return {oldValue : old, newValue : result};
        }else{
            this.triggerResize(null, {width : old}, {width : result});
            return this;
        }
    };
    $$.setW = $$.setWidth;
    $$.addWidth = function(width, resize){
        var el = this.getElement(), pr = this.getParent(), old = this.getWidth();
        return this.setWidth(old + stringAnalyz(el, pr, width), resize, old);
    };
    $$.setHeight = function(height, resize, addOld){
        var el = this.getElement(), pr = this.getParent(),
        old = addOld || this.getHeight(),
        result = stringAnalyz(el, pr, height);

        this.css('height', result);
        if(resize){
            return {oldValue : old, newValue : result};
        }else{
            this.triggerResize(null, {height : old}, {height : result});
            return this;
        }
    };
    $$.setH = $$.setHeight;
    $$.addHeight = function(height, resize){
        var el = this.getElement(), pr = this.getParent(), old = this.getHeight();
        return this.setHeight(old + stringAnalyz(el, pr, height), resize, old);
    };
    $$.setSize = function(width, height){
        var widthValue = this.setWidth(width, true), heightValue = this.setHeight(height, true);
        this.triggerResize(null, {
            width : widthValue.oldValue,
            height : heightValue.oldValue
        }, {
            width : widthValue.newValue,
            height : heightValue.newValue
        });
        return this;
    };
    $$.addSize = function(width, height){
        var widthValue = this.addWidth(width, true), heightValue = this.addHeight(height, true);
        this.triggerResize(null, {
            width : widthValue.oldValue,
            height : heightValue.oldValue
        }, {
            width : widthValue.newValue,
            height : heightValue.newValue
        });
        return this;
    };
    $$.setScrollTop = function(top){
        var el = this.getElement(), pr = this.getParent();
        el.scrollTop = stringAnalyz(el, pr, top);
        return this;
    };
    $$.setScrollLeft = function(left){
        var el = this.getElement(), pr = this.getParent();
        el.scrollLeft = stringAnalyz(el, pr, left);
        return this;
    };
    $$.getScrollLeft = function(){
        return this.getElement().scrollLeft;
    };
    $$.getScrollTop = function(){
        return this.getElement().scrollTop;
    };
    $$.getScrollWidth = function(){
        return this.getElement().scrollWidth;
    };
    $$.getScrollHeight = function(){
        return this.getElement().scrollHeight;
    };
    $$.getWidth = function(){
        return this.getElement().offsetWidth;
    };
    $$.getHeight = function(){
        return this.getElement().offsetHeight;
    };
    $$.getW = function(width){
        return this.getElement().offsetWidth;
    };
    $$.getH = function(height){
        return this.getElement().offsetHeight;
    };
    $$.getOwidth = function(){
        return this.getElement().clientWidth;
    };
    $$.getOheight = function(){
        return this.getElement().clientHeight;
    };
    $$.getOw = function(width){
        return this.getElement().clientWidth;
    };
    $$.getOh = function(height){
        return this.getElement().clientHeight;
    };
    $$.setPerSize = function(width, height){
        this.css({width : width+'%', height : height+'%'});
        return this;
    };
    $$.setPerWidth = function(width){
        this.css('width', width+'%');
        return this;
    };
    $$.setPerW = $$.setPerWidth;
    $$.setPerHeight = function(height){
        this.css('height', height+'%');
        return this;
    };
    $$.setPerH = $$.setPerHeight;
    $$.fullSize = function(){
        this.css({width: '100%', height: '100%'});
        return this;
    };
    $$.inlineBlock = function(){
        this.css('display', 'inline-block');
        return this;
    };
    $$.ib = function(){
        this.css('display', 'inline-block');
        return this;
    };
    $$.block = function(){
        this.css('display', 'block');
        return this;
    };
    $$.inline = function(){
        this.css('display', 'inline');
        return this;
    };
    $$.setBackColor = function(){
        if(arguments.length === 0){
            this.css('backgroundColor', 'transparent');
        }else if(arguments.length === 1){
            this.css('backgroundColor', arguments[0]);
        }else if(arguments.length === 3){
            this.css('backgroundColor', 'rgb('+arguments[0]+','+arguments[1]+','+arguments[2]+')');
        }else if(arguments.length === 4){
            this.css('backgroundColor', 'rgba('+arguments[0]+','+arguments[1]+','+arguments[2]+','+arguments[3]+')');
        }
        return this;
    };
    $$.setColor = function(){
        if(arguments.length === 0){
            this.css('color', 'transparent');
        }else if(arguments.length === 1){
            this.css('color', arguments[0]);
        }else if(arguments.length === 3){
            this.css('color', 'rgb('+arguments[0]+','+arguments[1]+','+arguments[2]+')');
        }else if(arguments.length === 4){
            this.css('color', 'rgba('+arguments[0]+','+arguments[1]+','+arguments[2]+','+arguments[3]+')');
        }
        return this;
    };
    $$.setShadow = function(){
        var self = this;
        if(arguments.length === 0){
            this.css('boxShadow', 'none');
        }else if(arguments.length === 1 && typeof arguments[0] === 'object' && arguments[0].length){
            var arg = arguments[0], result = '';
            for(var i = 0; i<arg.length; i++){
                (function(arg,count, max){
                    if(arg.length === 4){
                        result += arg[0]+'px '+arg[1]+'px '+arg[2]+'px '+arg[3];
                        if(count < max){
                            result += ', ';
                        }
                    }
                })(arg[i], i, arg.length-1);
            }

            this.css('boxShadow', result);

        }else if(arguments.length === 4){
            this.css('boxShadow', arguments[0]+'px '+arguments[1]+'px '+arguments[2]+'px '+arguments[3]);
        }
        return this;
    };
    $$.setTextShadow = function(){
        var self = this;
        if(arguments.length === 0){
            this.css('textShadow', 'none');
        }else if(arguments.length === 1 && typeof arguments[0] === 'object' && arguments[0].length){
            var arg = arguments[0], result = '';
            for(var i = 0; i<arg.length; i++){
                (function(arg,count, max){
                    if(arg.length === 4){
                        result += arg[0]+'px '+arg[1]+'px '+arg[2]+'px '+arg[3];
                        if(count < max){
                            result += ', ';
                        }
                    }
                })(arg[i], i, arg.length-1);
            }

            this.css('textShadow', result);

        }else if(arguments.length === 4){
            this.css('textShadow', arguments[0]+'px '+arguments[1]+'px '+arguments[2]+'px '+arguments[3]);
        }
        return this;
    };
    $$.html = function(html){
        this.getElement().innerHTML = html;
        return this;
    };
    $$.textNowrap = function(){
        this.css('whiteSpace', 'nowrap');
        return this;
    };
    $$.textNormal = function(){
        this.css('whiteSpace', 'normal');
        return this;
    };
    $$.setTextFamily = function(family){
        this.css('fontFamily', family);
        return this;
    };
    $$.setTextWeight = function(value){
        this.css('font-weight', value);
        return this;
    };
    $$.setText = function(txt){
        this.removeChild();
        this.append(document.createTextNode(txt));
        return this;
    };
    $$.addText = function(txt){
        // this.removeChild();
        this.append(document.createTextNode(txt));
        return this;
    };
    $$.setTextLineHeight = function(height){
        this.css('line-height', height);
        return this;
    };
    $$.setTLH = function(height){
        this.css('line-height', height);
        return this;
    };
    $$.getTextLineHeight = function(){
        return this.css('line-height') || 0;
    };
    $$.getTLH = function(){
        return this.css('line-height') || 0;
    };
    $$.setTextSize = function(size){
        this.css('fontSize', size);
        return this;
    };
    $$.setTS = function(size){
        this.css('fontSize', size);
        return this;
    };
    $$.getTextSize = function(){
        return this.css('fontSize') || 0;
    };
    $$.getTS = function(){
        return this.css('fontSize') || 0;
    };
    $$.setTextAlign = function(value){
        if(value){
            this.css('textAlign', value);
        }else{
            this.css('textAlign', 'center');
        }
        return this;
    };
    $$.setTA = function(value){
        if(value){
            this.css('textAlign', value);
        }else{
            this.css('textAlign', 'center');
        }
        return this;
    };
    $$.getTextAlign = function(){
        return this.css('textAlign');
    };
    $$.getTA = function(){
        return this.css('textAlign');
    };
    $$.setNowrap = function(){
        if(arguments.length === 0 || arguments[0] === true){
            this.css('whiteSpace', 'nowrap');
        }else{
            this.css('whiteSpace', 'normal');
        }

        return this;
    };
    $$.getText = function(txt){
        var el = this.getElement();
        if(el.$$isClass$$){
            var result = [];
            for(var i = 0; i<el.length; i++){
                result.push(el[i].textContent);
            }
            return result;
        }else{
            return el.textContent;
        }
    };
    $$.setMargin = function(){
        if(arguments.length === 0){
            this.css('margin', 'auto 0');
        }else if(arguments.length === 1){
            if(typeof arguments[0] === 'string'){
                this.css('margin', arguments[0]);
            }
        }else if(arguments.length === 4){
            this.css('margin', arguments[0]+'px '+arguments[1]+'px '+arguments[2]+'px '+arguments[3]+'px');
        }
        return this;
    };
    $$.setPadding = function(){
        if(arguments.length === 0){
            this.css('padding', 'auto 0');
        }else if(arguments.length === 1){
            if(typeof arguments[0] === 'string'){
                this.css('padding', arguments[0]);
            }
        }else if(arguments.length === 4){
            this.css('padding', arguments[0]+'px '+arguments[1]+'px '+arguments[2]+'px '+arguments[3]+'px');
        }
        return this;
    };
    $$.setBorderRadius = function(){
        if(arguments.length === 0){
            this.css('borderRadius', 'none');
        }else if(arguments.length === 4){
            this.css('borderRadius', arguments[0]+'px '+arguments[1]+'px '+arguments[2]+'px '+arguments[3]+'px');
        }
        return this;
    };
    $$.setBorder = function(){
        if(arguments.length === 0){
            this.css('border', '0px none transparent');
        }else if(arguments.length === 3){
            if(typeof arguments[2] === 'object'){
                var rgb = arguments[2];
                if(rgb.length === 3){
                    this.css('border', arguments[0]+'px '+arguments[1]+' rgb('+rgb[0]+','+rgb[1]+','+rgb[2]+')');
                }else if(rgb.length === 4){
                    this.css('border', arguments[0]+'px '+arguments[1]+' rgb('+rgb[0]+','+rgb[1]+','+rgb[2]+','+rgb[3]+')');
                }
            }else{
                this.css('border', arguments[0]+'px '+arguments[1]+' '+arguments[2]);
            }
        }
        return this;
    };
    $$.eventTrigger = function(eventName){
        var el = this.getElement();
        el.dispatchEvent(new Event(eventName));
    };
    $$.addEvent = function(name, fn){

        if(this.events[name]){
            this.events[name].push(fn);
        }else{
            this.events[name] = [fn];
        }

        var el = this.getElement();
        if(el.$$isClass$$){
            for(var i = 0; i<el.length; i++){
                el[i].addEventListener(name, fn);
            }
        }else{
            el.addEventListener(name, fn);
        }
        return this;
    };
    $$.removeEvent = function(name, fn){
        var el = this.getElement();
        if(el.$$isClass$$){
            for(var i = 0; i<el.length; i++){
                el[i].removeEventListener(name, fn);
            }
        }else{
            if(name){
                if(fn){
                    el.removeEventListener(name, fn);
                }else{
                    for(var i in this.events[name]){
                        el.removeEventListener(name, this.events[name][i]);
                    }
                }
            }else{
                for(var i in this.events){
                    for(var j in this.events[i]){
                        el.removeEventListener(i, this.events[i][j]);
                    }
                }
            }
        }
        return this;
    };

})(this);



// (function(){
//
//     var ws = new WebSocket("ws://echo.websocket.org");
//
//     ws.onmessage = function(event) {
//         console.log(event);
//         console.log('WebSocket test Message : ' + event.data);
//         ws.close();
//     };
//
//     ws.onopen = function(event) {
//         console.log("WebSocket is open now.");
//         ws.send("Hello server!");
//     };
//
//     ws.onerror = function(event) {
//         console.log("WebSocket is error.");
//     };
//
//     ws.onclose = function(event) {
//         console.log("WebSocket is closed now.");
//     };
//
// })();
