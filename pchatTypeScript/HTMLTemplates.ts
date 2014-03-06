﻿/// <reference path="core.ts" />
module HTMLTemplates
{
    export class HTMLTemplates{
        
	    static innerContentDiv_Video()
        {
            var contentDiv = '<div style="margin-top:5px;">\
			    			<img width="20" height="20" class="" src="https://pbs.twimg.com/profile_images/414219711803432960/VfrkHfhF_normal.png" alt="" style="vertical-align: middle;">	\
			    			<span class="" style="font-weight:bold;font-size:12px;">YouTube</span>' +
			    		'</div>\
			    		<div class="CardContent" style="margin-top:5px;">\
            				<div class="PlayerCard">\
      							<div class="Box">\
  									<div id="ExternalIframeContainer" class="FlexEmbed" data-iframe-height="281" data-iframe-width="500" style="height:281px;background-color:green;">\
    									<!--<iframe src="https://www.youtube.com/embed/YISBPq1NjLQ" frameborder="0" scrolling="no" allowtransparency="true" style="width:100%;height:100%;"></iframe>!-->\
  									</div>\
								</div>\
        						<h1 class="embeddedContentTitle">\
    								<a class="embeddedContentTitle" href="http://t.co/3OJEmceqnI">Brian! Robinson eager to change fortunes</a>\
  								</h1>      \
      							<p class="Description u-textBreak">\
  									<a class="embeddedContentText" href="http://t.co/3OJEmceqnI">\
    								Manager Karl Robinson talks to MK Dons Player about his desire to turn things around and his plans for the 	final two days of the transfer window.\
  									</a>\
								</p>\
    						</div>\
      					</div>';
            return contentDiv;
        }

	    static innerContentDiv_Drawing(imageData: Uint8Array)
        {
            console.log("innerContentDiv_Drawing: " + imageData.length);
            var contentDiv = '<div class="NormalCard">\
            					<img width="450" height="450" src="#srcData">\
    						</div>';
            var byteArrayTobase64 = (data: Uint8Array) => {
                return btoa(String.fromCharCode.apply(null, data));
            }
            var base64string = byteArrayTobase64(imageData);

            return contentDiv.replace('#srcData', 'data:image/jpeg;base64,' + base64string);
        }


        private static messageContentToHTML(messageContent: ViewModel.ViewModelMessageSpan[]) {
            return messageContent.map((span) => {
                if (span.messageSpanType === ViewModel.IViewModelMessageSpan.Text) {
                    return (<ViewModel.Text>span).text;
                } else if (span.messageSpanType === ViewModel.IViewModelMessageSpan.Hightlight) {
                    return "<b>%text%</b>".replace('%text%', (<ViewModel.Hightlight>span).text);
                } else if (span.messageSpanType === ViewModel.IViewModelMessageSpan.Hyperlink) {
                    var hyperlink = <ViewModel.Hyperlink>span;
                    return "<a href='%url%'>%text%</a>".replace("%text%", hyperlink.text).replace("%url%", hyperlink.url);
                }
            }).join()
        }


        static messageDiv(chatMessage : ViewModel.ChatMessage){



            var html = '<div  class="messageDiv">\
            	<div class="innerMessageDiv">\
                    <div class="innerInnerMessageDiv">\
			    	    <div  class="nameDiv">\
				        	<span>#name</span>\
			    	    </div>\
			    	    <div class="#messContentDiv" id="content">\
			    	    	<img class="thumbnailImg" style="#imgStyle">\
				        	<span>#message</span>\
			    	    </div>\
			    	    <div class="expandedContentDiv" style="overflow: hidden;">\
                        #contentDivHTML\
					    </div>\
				    #clickToExpandDiv\
                </div>\
        	</div>\
		</div>'

            var clickToExpandDiv = '<div class="clickToExpandDiv">Click to expand</div>';

            var stringIf = (condition: Boolean, trueString: string, falseString: string) => {
                if (condition) {
                    return trueString;
                } else {
                    return falseString;
                }
            };

            var getDisplayName = (messageType: ViewModel.ViewModelMessageType) => {
                if (messageType.messageTypeType === ViewModel.IViewModelMessageType.Normal) {
                    return (<ViewModel.Normal>messageType).person.name;
                }
                else if (messageType.messageTypeType === ViewModel.IViewModelMessageType.Server) {
                    return "Server";
                }
            };

            return html
                .replace('#name', getDisplayName(chatMessage.messageType))
                .replace('#message', HTMLTemplates.messageContentToHTML(chatMessage.messageContent))
                .replace('#contentDivHTML', "")
                .replace('#clickToExpandDiv', stringIf(chatMessage.hasExtraMedia, clickToExpandDiv, ""))
                .replace('#imgStyle', stringIf(
                    chatMessage.hasThumbnail,
                    "width:100px;height:100px;background-color: black;float:left; margin-right:5px; margin-bottom:5px;border:0px;",
                    "width:0px;height:0px;background-color: black;float:left; margin-right:0px; margin-bottom:0px;border:0px;"))
                .replace('#messContentDiv', stringIf(chatMessage.hasThumbnail, "messageContentDiv", ""))
            }
        }

}