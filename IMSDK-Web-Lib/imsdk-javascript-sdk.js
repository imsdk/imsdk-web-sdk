(function(win, $){
	win.IMSDK = {};
	
	var _listeners = {
		onInitialized : null,
		onDisConnected : null,
		onConnected : null,
		onConnectedError : null,
		onTextReceived : null,
		onImageReceived : null,
		onVoiceReceived : null,
		onSystemMsgReceived : null
	};

	win.IMSDK = function( app_key, listeners ) {
		if ( app_key==null || typeof(app_key)!=="string" || app_key.length==0 ) {
			return ;
		}

		$.extend(this, {
			'VERSION' : '0.0.1'
		});

		var GLOBAL_SETTINGS = $.extend({
			'accepts' : '',
			'cache' : false,
			'crossDomain' : true,
			'dataType' : 'json',
			'type':  'POST',
			'timeout' : 30000,
			'contentType' : 'application/json',
			'xhrFields': {
			 	'withCredentials': true
			 },
			'beforeSend' : function(xhr, settings){
				xhr.setRequestHeader('x-rid', Date.now());
				xhr.setRequestHeader('x-imsdk-id', this.imsdk_id);
			}
		}, win.Global_Config );

		$.ajaxSetup( GLOBAL_SETTINGS );

		var PROTOCOLS = 'http://';
		var VERSION = '/v1';
		var HOST = PROTOCOLS + 'rest.imsdk.im' + VERSION;
		HOST = PROTOCOLS + 'dev.sdk.imdingtu.com:81' + VERSION;

		$.extend(this, _listeners, listeners);
		var _isLogging = false;
		var _isLogin = false;
		this.current = {
			'cid' : null,
			'photo' : null,
			'nick_name' : null
		};

		var $this = this;

		this.app_key = app_key;
		this.imsdk_id = "";

		var APP_URL = HOST;

		var URLS = {
			REGISTER : APP_URL + '/reg',
			LOGIN : APP_URL + '/login',
			LOGOUT : APP_URL + '/logout',
			GET_USER : APP_URL + '/user/{cid}',
			FRIENDS : APP_URL + '/friends',
			MSG : APP_URL+ '/msg',
			NEW_MSG : APP_URL+ '/onlinemsg'
		};

		this.setLogging = function(isLogging) {
			_isLogging = isLogging==true ? true : false;
		};

		this.register = function( token, userInfo, onRegSuccess, onRegFailed  ) {

			(onRegSuccess && typeof(onRegSuccess)=='function') ||  ( onRegSuccess=function(){} );
			(onRegFailed && typeof(onRegFailed)=='function') ||  ( onRegFailed=function(){} );

			if ( _isLogin ) {
				onRegFailed.call( $this, -2, '重复的登录，要更换登录用户，请先登录' );
				return;
			};

			if ( typeof(token)!=='string' || token.length==0 ) {
				onRegFailed.call( $this, 4, 'Token 不能为空' );
				return;
			};

			var params = $.extend( userInfo, {
				'token' : token,
				'app_key' : this.app_key,
				'nick_name' : '',
				'photo' : ''
			});

			__aPostData(
				this, 
				URLS.REGISTER, 
				params,
				function(data, params){
					_isLogin = true;

					this.current['cid'] = data;

					onRegSuccess.call( this, data );
				},
				onRegFailed
			);
		}

		this.login = function(cid, password, onLoginSuccess, onLoginFailed) {
			(onLoginSuccess && typeof(onLoginSuccess)=='function') ||  (onLoginSuccess=function(){} ) ; 
			(onLoginFailed && typeof(onLoginFailed)=='function') ||  ( onLoginFailed=function(){} );

			if ( _isLogin ) {
				onLoginFailed.call( this, -2, '重复的登录，要更换登录用户，请先登出' );
				return;
			};

			var params = {
				'app_key' : this.app_key,
				'cid' : cid,
				'password' : password
			};


			__aPostData(
				this, 
				URLS.LOGIN, 
				params,
				function(data){
					_isLogin = true;

					this.imsdk_id = data['IMSDKID'];
					delete data['IMSDKID'];

					$.extend(this.current, data);
					__openLongPolling.call(this);

					onLoginSuccess.call( this, data );
				},
				onLoginFailed
			);
		}

		this.logout = function( onLogoutSuccess, onLogoutFailed ) {
			(onLogoutSuccess && typeof(onLogoutSuccess)=='function') ||  ( onLogoutSuccess=function(){ } );
			(onLogoutFailed && typeof(onLogoutFailed)=='function') ||  ( onLogoutFailed=function(){} );

			__aPostData(
				this, 
				URLS.LOGOUT, 
				{},
				function(data){
					_isLogin = false;

					$.extend( this.current , {} );

					onLogoutSuccess.call( this, data );
				},
				onLogoutFailed
			);
		}

		this.getStatus = function(){
			return _isLogin;
		}

		this.getUserInfo = function(cid) {
			var url = URLS.GET_USER.replace('{user}', this.current.cid);
			return __getData(
				this,
				url,
				{}
			);
		}

		this.getFriends = function(cid) {
			var url = URLS.FRIENDS;
			return __getData(
				this,
				url,
				{}
			);
		}


		this.sendUserMsg = function( userMsg, onSendSucc, onSendFailed ) {
			(onSendSucc && typeof(onSendSucc)=='function') ||  ( onSendSucc=function(){ } );
			(onSendFailed && typeof(onSendFailed)=='function') ||  ( onSendFailed=function(){} );

			userMsg['target_type'] = 'user';
			__aPostData(
				this, 
				URLS.MSG, 
				userMsg,
				onSendSucc,
				onSendFailed
			);
		}

		this.sendTeamMsg = function( userMsg, onSendSucc, onSendFailed ) {
			(onSendSucc && typeof(onSendSucc)=='function') ||  ( onSendSucc=function(){ } );
			(onSendFailed && typeof(onSendFailed)=='function') ||  ( onSendFailed=function(){} );

			userMsg['target_type'] = 'team';
			__aPostData(
				this, 
				URLS.MSG, 
				userMsg,
				onSendSucc,
				onSendFailed
			);
		}

		var __sendText = function( msg, onSendSucc, onSendFailed ) {
			__aPostData(
				this, 
				URLS.MSG, 
				msg,
				onSendSucc,
				onSendFailed
			);
		}

		var __aPostData = function(ctx, url, params, onSuccess, onFailed ) {
			$.ajax( {
				url : url, 
				data : win.IMSDK.ParamsBuilder.buildPostData(params),
				context : ctx || this,
				complete: function( jqXHR, textStatus ) {
					try{
						var data  = jqXHR.responseJSON;
						if ( data['status']==0 ) {
							onSuccess.call( $this, data['data'], params );
						} else {
							onFailed.call( $this, data['status'], data['error_msg'], params );
						}
					} catch ( e ) {
						onFailed.call( $this, -1, e );
					}
				}
			} );
		};
		var __getData = function( ctx, url, params ) {
			var result = null;
			$.ajax( {
				url : url, 
				data : params,
				type: 'GET',
				async: false,
				context : ctx || this,
				complete: function( jqXHR, textStatus ) {
					try{
						var data = jqXHR.responseJSON;
						if (data['status']==0) {
							result = { 'code':0, 'data':data['data'] };
						} else {
							result = { 'code':data['status'], 'error_msg':data['error_msg'] };
						}
					} catch ( e ) {
						result = { 'code':-1, 'error_msg':e };
					}
				}
			} );

			return result;
		}

		var __openLongPolling = function(){
			if ( !_isLogin ) {
				$this.onDisConnected
				&& typeof( $this.onDisConnected ) === 'function'
				&& $this.onDisConnected.call( $this );
				return;
			}

			var url = URLS.NEW_MSG;

			$.ajax( {
				url : url, 
				data : {},
				context : $this,
				complete: function( jqXHR, textStatus ) {
					/*console.log('heart beat - ' + textStatus + '-' + Date.now()); */

					var conntectAgain = true;
					try{
						var data = jqXHR.responseJSON;
						switch ( data['status'] ) {
						case 0:
							var msgPkgs = data['data'];
							$.each(msgPkgs, function(i, n){
								var pkgType = n.type;
								var msgList = n.data;
								switch (pkgType){
								case 'p2p':
									$.each(msgList, function(j, msg){
										switch(msg['msg_type']){
										case 'voice':
											$this.onVoiceReceived
											&& typeof($this.onVoiceReceived) === 'function'
											&& $this.onVoiceReceived.call( $this, msg );
											break;
										case 'img':
											$this.onImageReceived
											&& typeof($this.onImageReceived) === 'function'
											&& $this.onImageReceived.call( $this, msg );
											break;
										default:
											$this.onTextReceived
											&& typeof($this.onTextReceived) === 'function'
											&& $this.onTextReceived.call( $this, msg );
											break;
										}
									});
								}
							});

							break;
						case 4:
							_isLogin = false;
							break;
						case 1:
						case 2:
						case 3:
							console.error( 'get msg error - [ code:' + data['status'] + ' msg:' + data['error_msg']  + ']');
							conntectAgain = false;
							break;
						default:
							console.error( 'get msg error - [ code:' + data['status'] + ' msg:' + data['error_msg']  + ']');
							break;
						}
					} catch ( e ) {
						console.warn( 'get msg exception - ' + e );
					}
					if (conntectAgain){
						__openLongPolling.call( $this );
					}
				}
			} );
		}

		this.onInitialized 
		&& typeof(this.onInitialized)==='function' 
		&& this.onInitialized( { 'app_key': this.app_key } );
	};


	win.IMSDK.ParamsBuilder = function(){
		return {
			buildPostData : function(p){
				if (typeof(p)!=='object') {return null;}

				return JSON.stringify(p);
			}
		};
	}();

}(window, jQuery));