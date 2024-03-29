/**
 * 描述：本脚本是从360好搜扒下来的，别说我如何如何无耻，360扒的百度，百度扒的谷歌，就是这么屌！
    rili-widget 所包含的JS文件们
 * 共包含15个JS文件，由于彼此间存在依赖关系，它们的顺序必须依次是：
 *		1.jquery-ui-1.10.3.custom
 *		2.msg_config	// 配置事件消息
 *
 *		3.mediator	  //库，基于事件的异步编程
 *		4.calendar    //日历类
 *		5.lunar       //农历
 *
 *		6.cachesvc    //window. appdata依赖它
 *		7.appdata     //window. 时间矫正
 *		8.timesvc     //window.TimeSVC  时间同步服务
 *
 *		9.huochepiao    //购票（无用）
 *
 *		10.fakeSelect    //$-ui  年份月份下拉选择器
 *		11.speCalendar   //$-ui 日历单元格的特殊内容
 *		12.webCalendar   //$-ui 日历单元格
 *		13.dayDetail     //$-ui 日历右侧的详情（黄历 忌宜）
 *
 *		14.xianhao      //注册事件：日历上方的操作工具条：年月日节假日 返回今天
 *		15.dispatcher   //提取参数，初始化日历
 *
 * 最后拼接的顺序是 jquery-ui-1.10.3.custom,msg_config,mediator,calendar,lunar,cachesvc,appdata,timesvc,huochepiao,fakeSelect,speCalendar,webCalendar,dayDetail,xianhao,dispatcher
 *
 * edit by @gaosong 2015-08-31
 *
 * 代码从导航日历迁移过来，
 */
 
_loader.remove && _loader.remove("rili-widget");
_loader.add("rili-widget", "./js/wnl.js");//上述JS文件们已让我压缩成wnl.js
_loader.use("jquery, rili-widget", function(){

	var RiLi = window.OB.RiLi;

	var gMsg = RiLi.msg_config,
		dispatcher = RiLi.Dispatcher,
		mediator = RiLi.mediator;

	var root = window.OB.RiLi.rootSelector || '';

	// RiLi.AppData(namespace, signature, storeObj) 为了解决"In IE7, keys may not contain special chars"
	//'api.hao.360.cn:rili' 仅仅是个 namespace
	var timeData = new RiLi.AppData('api.hao.360.cn:rili'),
		gap = timeData.get('timeOffset'),
		dt = new Date(new Date() - (gap || 0));

	RiLi.action = "default";

	var $detail = $(root+'.mh-almanac .mh-almanac-main');
	$detail.dayDetail(dt);

	RiLi.today = dt;

	var $wbc = $(root+'.mh-calendar'); 

	mediator.subscribe(gMsg.type.actionfestival , function (d){
		var holi = RiLi.dateFestival,
			val = d.val ? decodeURIComponent(d.val) : "",
			holiHash = {},
			el,
			node = {};

		for (var i = 0 ; i < holi.length ; ++i){
			el = holi[i];
			el = $.trim(el).split("||");
			if (el.length == 2){
				node = {};
				node.year = el[0].substr(0 , 4);
				node.month = el[0].substr(4 , 2);
				node.day = el[0].substr(6 , 2);
				holiHash[el[1]] = node;
			}
		};

		RiLi.action = "festival";
		
		if (holiHash[val]){
			node.year = holiHash[val].year;
			node.month = holiHash[val].month;
			node.day = holiHash[val].day;

			RiLi.needDay = new Date(parseInt(node.year , 10) , parseInt(node.month ,10) - 1 , node.day);
			$wbc.webCalendar({
				time : new Date(parseInt(node.year , 10) , parseInt(node.month ,10) - 1 , node.day),
				onselect: function(d, l){
					$detail.dayDetail('init', d , l);
				}
			}); 
		}
		else{
			RiLi.action = "default";
		}
	});	

	mediator.subscribe(gMsg.type.actionquery , function (d){
		var strDate;

		if (!d.year || d.year > 2100 || d.year < 1901){
			RiLi.action = "default";
			return 0;
		}
		
		d.month = parseInt(d.month , 10);

		if (d.month &&  (d.month > 12 || d.month < 1)){
			RiLi.action = "default";
			return 0;
		}

		if (!d.month){
			d.month = 1 ;
		}
		
		d.day = parseInt(d.day , 10);

		if (!d.day){
			d.day = 1;
		} 

		RiLi.action = "query";    	
		RiLi.needDay = new Date(parseInt(d.year , 10) , parseInt(d.month ,10) - 1 , d.day);

		$wbc.webCalendar({
			time : new Date(parseInt(d.year , 10) , parseInt(d.month ,10) - 1 , d.day),
			onselect: function(d, l){
				$detail.dayDetail('init', d , l);
			}
		}); 
	});

	mediator.subscribe(gMsg.type.actiongoupiao, function (d){
		RiLi.action = "goupiao";
		$wbc.webCalendar({
			time : dt,
			onselect: function(d, l){
				$detail.dayDetail('init', d , l);
			}
		}); 
	   
	});

	mediator.subscribe(gMsg.type.actiondefault , function (d){
		RiLi.needDay = dt;
		$wbc.webCalendar({
			time : dt,
			onselect: function(d, l){
				$detail.dayDetail('init', d , l);
			}
		}); 
	});    

	dispatcher.dispatch();

	mediator.subscribe(gMsg.type.dch , function (d){
		// if (RiLi.needDay){
		// 	$wbc.webCalendar("initTime" , RiLi.needDay);
		// }
		// else{
		// 	$wbc.webCalendar("initTime" , RiLi.today);
		// }
		$wbc.webCalendar("initTime" , RiLi.needDay||RiLi.today);
	});   
	
	mediator.publish(gMsg.type.dch ,  dt);

	var nowDate = (new Date()).getTime() ;

	/* 时间矫正 */
	RiLi.TimeSVC.getTime(function(d){
		var trueTime = d.getTime();
		var timeData = new RiLi.AppData('api.hao.360.cn:rili') , isFirst = true;

		if(Math.abs(nowDate - trueTime) > 300000){
			timeData.set('timeOffset', nowDate - trueTime);
		}
		else {
			timeData.remove('timeOffset');
		}

		if (typeof gap == undefined || !isFirst){
			RiLi.today = d;
			mediator.publish(gMsg.type.dch , d);
		}

		isFirst = false;
	});

	//日历初始完后的回调
	if(typeof RiLi.CallBack.afterInit === "function"){
		RiLi.CallBack.afterInit();
	}

});