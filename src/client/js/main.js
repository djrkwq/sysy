/*
    기본적 요소 제외한 최초 실행 로직
    - config.js, jsList.js 를 제외한 최초 실행 로직
    - deviceManager와 Api, appManger를 이용하여 최초 로드를 시도
*/
lo(function(side_lo, appMgrList){

    /*
        각 기본 side_lo 객체
        - 가독성, 접근성을 위하여 해당 글로벌 변수는 및 컴포넌트 사용은
        아래처럼 변수를 선언하고 사용하자 ( 필수는 아님 )
    */
    var component = side_lo.component, // 컴포넌트
    baseComponent = side_lo.baseComponent, // 베이스 컴포넌트
    globals = side_lo.global, // 글로벌 리스트
    gObject = globals.object, // 글로벌 오브젝트
    gArray = globals.array, // 글로벌 오브젝트
    gFunction = globals.function, // 글로벌 함수
    gInstance = globals.instance, // 글로벌 인스턴스 ( new 없이 인스턴스로 생성 )
    gVariable = globals.variable; // 글로벌 변수

    /* 외부 연동용 */
    var app_mgr = null,
    electron = require('electron'),
    e_util = {
        ipc_renderer : electron.ipcRenderer
    };

    /* jslst.js 의 정적 js 파일들을 모두 로드한뒤에 동작하는 함수 이다. */
    gFunction.set('start', function(){

        /* 기초 변수 선언 */
        app_mgr = appMgrList('tt'); // 앱 매니저 선언(최초 선언)

        app_mgr.init({
            displayData : { // 디스플레이 데이터
                type : 'full'
            }
        });

        app_mgr.addViewHistory('popup', 'intro-1', 'intro', {
            ipc_renderer : e_util.ipc_renderer
        }).apply(function(){
            /* 서버에 앱 준비 알림 */
            e_util.ipc_renderer.send('app_ready');
        }, true, true);

    });



});
