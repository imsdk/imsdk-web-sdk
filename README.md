# imsdk-web-sdk
IMSDK Web SDK，由爱萌科技官方维护



## 概述
IMSDK Web SDK V1 版本，使用传统的 ajax long polling 的方式，兼容更多版本浏览器。
通过 Web SDK 可以方便实现注册、登录、收发消息，可以方便实现

## 新手上路
### 一、获取 SDK
  官方下载：敬请期待
  github：https://github.com/imsdk/imsdk-web-sdk

### 二、初始化
```
var imCli = new IMSDK( '00b6413a92d4c1c84ad99e0a', '{token}', {
    onInitialized : function( appEnv ){
        console.info( '初始化环境完成，当前应用：' + appEnv.appKe
    },
    onTextReceived : function( TextMsg ){
        console.info('收到文本消息 - TextMsg');
         
    },
    onImageReceived : function( ImageMsg ){},
    onVoiceReceived : function( VoiceMsg ){},
    onSystemMsgReceived : function( SystemMsg ){}  
} );
```
### 三、发送消息
```
var userMsg = {
    'target_type' : type,
    'target' : target,
    'msg_type' : 'txt',
    'content' : msg
};
imCli.sendText( userMsg, function(data, params){
    console.log( 'send data success');
}, function(code, error, params){
});
```
