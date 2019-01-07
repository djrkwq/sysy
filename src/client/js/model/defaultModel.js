lo(function(side_lo, appMgrList){

    /*
        기능, 키 모델 정의
        - olo App에 기본적으로 필요한 모델을 정의하였다.
        - 직접 로드(jsList)를 하거나
        - appMgr.loadModel(['파일 이름'], function(){}) 로 동적로드를 시도 해야한다.
    */

    /* 앱 매니저 로드 */
    var appMgr = appMgrList('tt'), globals = side_lo.global,
    gArray = globals.array, gObject = globals.object, gVariable = globals.variable;

    appMgr.setKeyModel({
        test : function(datas){ // 왼쪽 방향 키
            console.log('click');
        }
    });

});
