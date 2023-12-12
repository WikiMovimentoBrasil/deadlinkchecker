/*
	Wikipedia Dead Link Finder
	==========================
	a script for finding external links on MediaWiki-pages, which do not 
	return the HTTP status code 200 and marking them
	
	To view detailed documentation (available in English and German): 
	https://de.wikipedia.org/wiki/Benutzer:Frog23/Dead_Link_Finder/en
	
	This script is still a beta release. If you experience any problems
	or have questions or comments, please post them on the discussion
	page of the script: 
	https://de.wikipedia.org/wiki/Benutzer_Diskussion:Frog23/Dead_Link_Finder
	
	Privacy Information
	-------------------
	This scripts send the URLs to be tested to a tool on the Wikimedia Tool 
	Forge Server (https://deadlinkfinder.toolforge.org/) which checks the links. The 
	requests and results are logged for later statistical evaluation and 
	improvement of the script. No individual related information are stored!
	At some point in the future all previously found dead links will be 
	displayed to the public. 
	
	Author: Frog23 <deadlinkfinder@frog23.net>
	
    Copyright (C) 2013  

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
    
*/

if(!DeadLinkFinder) var DeadLinkFinder = {};

DeadLinkFinder = {
	links:'',
	counter: 0,
	deadLinkCount: 0,
	showOk: false,
	showUnsupportedProtocol: false,
	fadeOk: true,
	linkToLinkSearch: false,
	showIndividualOK: false,
	countDiv: '',
	okDiv:'',
	fadeOutDelay: 3000,
	timeToFade: 500,
	browsemode:false,
	browsemode_showLink:false,
	showWaitingIcon:false,
	showContentType:false,
	runAlways:false,
	checkDeadLinksManually:false,
	checkDeadLinksCookie:false,
	namespaceFilter:[0],
	language:mw.config.get('wgUserLanguage'),
	fallbackLanguage:"en",
	wmfProjects:new Array("^https?:\\/\\/[\\w-]+\\.wikipedia\\.org","^https?:\\/\\/([\\w-.]+)?wikimedia\\.(org|ch|at|de)","^https?:\\/\\/toolserver\\.org",
			"^https?:\\/\\/creativecommons\\.org","^https?:\\/\\/www\\.gnu\\.org","^https?:\\/\\/wikimediafoundation\\.org","^https?:\\/\\/wikimedia\\.de",
			"^https?:\\/\\/([\\w-.]+)?wikiquote\\.org","^https?:\\/\\/([\\w-.]+)?wikisource\\.org","^https?:\\/\\/([\\w-.]+)?wikiversity\\.org","^https?:\\/\\/([\\w-.]+)?wiktionary\\.org",
			"^https?:\\/\\/([\\w-.]+)?mediawiki\\.org","^https?:\\/\\/([\\w-.]+)?wikinews\\.org","^https?:\\/\\/([\\w-.]+)?wikibooks\\.org", "^https?:\\/\\/tools\\.wmflabs\\.org",
			"^https?:\\/\\/([\\w-.]+)?toolforge\\.org", "^https?:\\/\\/([\\w-.]+)?wikitravel\\.org","^https?:\\/\\/([\\w-.]+)?wikidata\\.org","^https?:\\/\\/secure.wikimedia\\.org"),
	
	init: function(){
		//load file the the localized texts
		
		mw.loader.using('mediawiki.util',function(){
			mw.loader.load( "https://deadlinkfinder.toolforge.org//script-languages.js",);
			//the script will call the function findLinks() when it is loaded (to avoid problems of parallel loading)
		});
		
	},
	
	findLinks: function(){
		// settings for showing Ok-Icon after no dead links were found (default = false)
		// to use it, add the following line to the JS-File of your skin: (without the comments of cause)
		// var deadLinkFinder_showOk = true;
		if (typeof deadLinkFinder_showOk === 'undefined') {
			deadLinkFinder_showOk = DeadLinkFinder.showOk;
		}		
		DeadLinkFinder.showOk = deadLinkFinder_showOk;

		// settings for fading Ok-Icon after a few seconds (default = false)
		// to use it, add the following line to the JS-File of your skin: (without the comments of cause)
		// var deadLinkFinder_fadeOk = true;
		if (typeof deadLinkFinder_fadeOk === 'undefined') {
			deadLinkFinder_fadeOk = DeadLinkFinder.fadeOk;
		}
		DeadLinkFinder.fadeOk = deadLinkFinder_fadeOk;

		// settings for also indicating links with unsupported protocolls (like irc://...) (default = false)
		// to use it, add the following line to the JS-File of your skin: (without the comments of cause)
		// var deadLinkFinder_showUnsupportedProtocol = true;
		if (typeof deadLinkFinder_showUnsupportedProtocol === 'undefined') {
			deadLinkFinder_showUnsupportedProtocol = DeadLinkFinder.showUnsupportedProtocol;
		}
		DeadLinkFinder.showUnsupportedProtocol = deadLinkFinder_showUnsupportedProtocol;

		// settings for showing a link to start the browsemode (the script will automatically search random
		// pages until a dead link is found) (default = false)
		// to use it, add the following line to the JS-File of your skin: (without the comments of cause)
		// var deadLinkFinder_showBrowsemodeLink = true;
		if (typeof deadLinkFinder_showBrowsemodeLink === 'undefined') {
			deadLinkFinder_showBrowsemodeLink = DeadLinkFinder.browsemode_showLink;
		}
		DeadLinkFinder.browsemode_showLink = deadLinkFinder_showBrowsemodeLink;

		// settings for showing waiting icon, will the links on a page are still checked but no dead link
		// has been found yet. (default = false)
		// to use it, add the following line to the JS-File of your skin: (without the comments of cause)
		// var deadLinkFinder_showWaitingIcon = true;
		if (typeof deadLinkFinder_showWaitingIcon === 'undefined') {
			deadLinkFinder_showWaitingIcon = DeadLinkFinder.showWaitingIcon;
		}
		DeadLinkFinder.showWaitingIcon = deadLinkFinder_showWaitingIcon;

		// settings for the namespace filter, which defines a list of namespaces which are checked automatically
		// default = {0}, which means only the default namespace is checked automatically, for every other 
		// namespace the user has to click a link to check it manually.
		// to use it, add the following line to the JS-File of your skin: (without the comments of cause) and
		// add the numbers of the namespaces you wish to have searched automatically
		// var deadLinkFinder_namespaceFilter = [0,1];
		if (typeof deadLinkFinder_namespaceFilter === 'undefined') {
			deadLinkFinder_namespaceFilter = DeadLinkFinder.namespaceFilter;
		}
		DeadLinkFinder.namespaceFilter = deadLinkFinder_namespaceFilter;
		
		// settings for always running the DeadLinkFinder. (default = false)
		// even if enabled, it still uses the namespaceFilter, so by default it will only check the links
		// on pages in the article namespace.
		// to use it, add the following line to the JS-File of your skin: (without the comments of cause)
		// var deadLinkFinder_runAlways = true;
		if (typeof deadLinkFinder_runAlways === 'undefined') {
			deadLinkFinder_runAlways = DeadLinkFinder.runAlways;
		}
		DeadLinkFinder.runAlways = deadLinkFinder_runAlways;
			
		// settings for linking the warning icon to the link search. (default = false)
		// to use it, add the following line to the JS-File of your skin: (without the comments of cause)
		// var deadLinkFinder_linkToLinkSearch = true;
		if (typeof deadLinkFinder_linkToLinkSearch === 'undefined') {
			deadLinkFinder_linkToLinkSearch = DeadLinkFinder.linkToLinkSearch;
		}
		DeadLinkFinder.linkToLinkSearch = deadLinkFinder_linkToLinkSearch;
		
		// settings for showing an ok-sign after each checked link. (default = false)
		// to use it, add the following line to the JS-File of your skin: (without the comments of cause)
		// var deadLinkFinder_showIndividualOK = true;
		if (typeof deadLinkFinder_showIndividualOK === 'undefined') {
			deadLinkFinder_showIndividualOK = DeadLinkFinder.showIndividualOK;
		}
		DeadLinkFinder.showIndividualOK = deadLinkFinder_showIndividualOK;
		
		// settings for showing the content type of a link next to the OK symbol. (default = false)
		// to use it, add the following line to the JS-File of your skin: (without the comments of cause)
		// var deadLinkFinder_showContentType = true;
		if (typeof deadLinkFinder_showContentType === 'undefined') {
			deadLinkFinder_showContentType = DeadLinkFinder.showContentType;
		}
		DeadLinkFinder.showContentType = deadLinkFinder_showContentType;
		
		// settings for showing an arrow if the link gets redirected. (default = false)
		// to use it, add the following line to the JS-File of your skin: (without the comments of cause)
		// var deadLinkFinder_showRedirects = true;
		if (typeof deadLinkFinder_showRedirects === 'undefined') {
			deadLinkFinder_showRedirects = DeadLinkFinder.showRedirects;
		}
		DeadLinkFinder.showRedirects = deadLinkFinder_showRedirects;
		
		// settings for the language of the dead link finder. (default: the language of your Wiki user interface
		// or if that language is not supported the default is English)
		// to use it, add the following line to the JS-File of your skin: (without the comments of cause) and
		// change it to the language you prefer (currently only English ["en"] and German ["de"] are supported,
		// but more languages will be added in the future
		// var deadLinkFinder_language = "en";
		if (typeof deadLinkFinder_language === 'undefined') {
			deadLinkFinder_language = DeadLinkFinder.language;
		}
		DeadLinkFinder.language = deadLinkFinder_language;
		// check if language exists, otherwise use fallback
		if(!DeadLinkFinder.texts[DeadLinkFinder.language]){
			//language set by user manually not found, so try the language specified by the user in Wiki-Settings
			DeadLinkFinder.language = mw.config.get('wgUserLanguage');
			if(!DeadLinkFinder.texts[DeadLinkFinder.language]){	
				//wgUserLanguage not found, so use default fallback language
				DeadLinkFinder.language = DeadLinkFinder.fallbackLanguage;
			}
		}
		lang = DeadLinkFinder.language;
		txts = DeadLinkFinder.texts;
		
		//check for browsemode cookie
		browsemode = DeadLinkFinder.getCookie('DeadLinkFinder_browsemode');
		if (browsemode=="on"){
			DeadLinkFinder.browsemode = true;
		}
		
		//check for browsemode markers in the url
		if(document.URL.indexOf("browsemode=on")>-1){
			DeadLinkFinder.browsemode = true;
			DeadLinkFinder.setCookie('DeadLinkFinder_browsemode','on',1);
		}else if(document.URL.indexOf("browsemode=off")>-1){
			DeadLinkFinder.browsemode = false;
			DeadLinkFinder.setCookie('DeadLinkFinder_browsemode','off',1);
		}
		
		//check for manual checking markers in the url
		if(document.URL.indexOf("checkLinks=true")>-1){
			DeadLinkFinder.checkDeadLinksManually = true;
		}
		
		//check for automatic checking cookie
		var checkDeadLinksCookie = DeadLinkFinder.getCookie('DeadLinkFinder_alwaysCheck');
		if (checkDeadLinksCookie=="on"){
			DeadLinkFinder.checkDeadLinksCookie = true;
		}
		
		var start = false;
		//check if dead links should be checked automatically
		if(DeadLinkFinder.browsemode){
			start = true;
		}else{
			if(DeadLinkFinder.checkDeadLinksManually){
				start = true;
			}else{
				if(DeadLinkFinder.runAlways){
					if(DeadLinkFinder.checkNamespace()&&(mw.config.get('wgIsArticle')|mw.config.get('wgAction')=="submit")){
						start = true;
					}else{
						//set manual check link
						DeadLinkFinder.addCheckManuallyLink();
					}
				}else{
					if(DeadLinkFinder.checkDeadLinksCookie){
						if(DeadLinkFinder.checkNamespace()&&(mw.config.get('wgIsArticle')|mw.config.get('wgAction')=="submit")){
							start = true;
						}else{
							//set manual check link
							DeadLinkFinder.addCheckManuallyLink();
						}
						//add link to switch off automatic checking
						mw.util.addPortletLink("p-tb","javascript:DeadLinkFinder.stopAlwaysCheckingForDeadLinks()",txts[lang]["stopAlwaysChecking"], "t-stopAlwaysChecking",txts[lang]["stopAlwaysCheckingDescription"],txts[lang]["stopAlwaysCheckingKey"],document.getElementById("t-whatlinkshere"));
						
					}else{
						//set manual check link
						DeadLinkFinder.addCheckManuallyLink();
						//add link to switch on automatic checking
						mw.util.addPortletLink("p-tb","javascript:DeadLinkFinder.startAlwaysCheckingForDeadLinks()",txts[lang]["startAlwaysChecking"], "t-startAlwaysChecking",txts[lang]["startAlwaysCheckingDescription"],txts[lang]["startAlwaysCheckingKey"],document.getElementById("t-whatlinkshere"));
						
					}
				}
			}
		}
		
		if(start){
			DeadLinkFinder.start();
		}else{
			//set browsemode links
			if(DeadLinkFinder.browsemode_showLink){
				if(DeadLinkFinder.browsemode){
					mw.util.addPortletLink("p-tb","javascript:DeadLinkFinder.stopBrowseMode()",txts[lang]["stopBrowsemode"], "t-browsemode",txts[lang]["stopBrowsemodeDescription"],txts[lang]["stopBrowsemodeKey"],document.getElementById("t-whatlinkshere"));
				}else{
					mw.util.addPortletLink("p-tb","javascript:DeadLinkFinder.startBrowseMode()",txts[lang]["startBrowsemode"], "t-browsemode",txts[lang]["startBrowsemodeDescription"],txts[lang]["stopBrowsemodeKey"],document.getElementById("t-whatlinkshere"));
				}
				DeadLinkFinder.browsemode_showLink = false;
			}
		}

	},
	
	start:function(){
		
		//set browsemode links
		if(DeadLinkFinder.browsemode_showLink){
			if(DeadLinkFinder.browsemode){
				mw.util.addPortletLink("p-tb","javascript:DeadLinkFinder.stopBrowseMode()",txts[lang]["stopBrowsemode"], "t-browsemode",txts[lang]["stopBrowsemodeDescription"],txts[lang]["stopBrowsemodeKey"],document.getElementById("t-whatlinkshere"));
			}else{
				mw.util.addPortletLink("p-tb","javascript:DeadLinkFinder.startBrowseMode()",txts[lang]["startBrowsemode"], "t-browsemode",txts[lang]["startBrowsemodeDescription"],txts[lang]["stopBrowsemodeKey"],document.getElementById("t-whatlinkshere"));
			}
		}
		
		//show waiting icon if user has set the setting accordingly
		if(DeadLinkFinder.showWaitingIcon){
			var waitingDiv = document.createElement("div");
				waitingDiv.id = "waiting-div";
				waitingDiv.innerHTML = "<img src=\"https://upload.wikimedia.org/wikipedia/commons/d/d2/Spinning_wheel_throbber.gif\" style=\"float:left;\" alt=\""+txts[lang]["searching"]+"\">";
				waitingDiv.style.position = "fixed"; 
				waitingDiv.style.bottom = "0px"; 
				waitingDiv.style.right = "0px";

			document.getElementById("bodyContent").appendChild(waitingDiv);
		}
		
		//get all external links (rewritten to work with IE8)
		DeadLinkFinder.links = new Array();
			// 7 = XPathResult.ORDERED_NODE_SNAPSHOT_TYPE 
			//DeadLinkFinder.links = document.evaluate('id("bodyContent")//a[starts-with(@class, "external")]', document, null, 7, null);
		var allLinks = document.getElementById("bodyContent").getElementsByTagName("a");
		var linkCounter = 0;
		for (var i = 0; i < allLinks.length; i++) {   
			if(allLinks[i].className.substring(8,0)=="external"){
				DeadLinkFinder.links[linkCounter]=allLinks[i];
				linkCounter++;
			}
		}  
		//start with the first link
		DeadLinkFinder.next();
	},
	
	next:function(){
		//if not all links have been checked
		if(DeadLinkFinder.counter < DeadLinkFinder.links.length) {
			//select the next link
			var link = DeadLinkFinder.links[DeadLinkFinder.counter];
			
			//check if link belongs to a Media-Wiki-Project or a related project
			if(DeadLinkFinder.wmfLink(link.href)){
				DeadLinkFinder.counter++;
				DeadLinkFinder.next(); 
				return;
			}
			
			var flags = "";
			if(DeadLinkFinder.showRedirects==true){
				flags = "showRedirect=true&";
			}
			if(DeadLinkFinder.showContentType==true){
				flags = flags+"showContentType=true&";
			}
			var linkText = 'https://deadlinkfinder.toolforge.org/headerproxy/get.php?'+flags+'link='+link.href;
			
			var isIE8 = window.XDomainRequest ? true : false;
			var invocation;

			if (isIE8){
				invocation = new window.XDomainRequest();
			}else{
				invocation = new XMLHttpRequest();
			}
		    
			//function for calling the other domain, response function is also given
		    function callOtherDomain(){
		        if(invocation){   
		        	if(isIE8){
		        		invocation.onload = processResponse;
			            invocation.open('GET', linkText, true);
			            invocation.send();
		        	}else{
		        		invocation.open('GET', linkText, true);
		        		
		        		var contentType = encodeURI(mw.config.get('wgPageName'));

		        		//special rules for the special page LinkSearch: report the containing page and not the linkSearch page
		        		//back to the server
		                if(mw.config.get('wgCanonicalNamespace')=="Special" && mw.config.get('wgCanonicalSpecialPageName')=="LinkSearch"){
		                	if(link.parentNode.nodeName=="LI"){
		                		var articleName = link.parentNode.lastChild.innerHTML;
		                		contentType = encodeURI(articleName.replace(/\s/g,"_"));	                		
		                	}
		                	
		                }

		        		//this is a dirty hack: two HTTP header fields are used to transport different data then then were designed for
		        		//normally this data should be tranmitted via custom headers, however they require a CORS-preflight request with
		        		//the OPTIONS method first and the toolserver currently does not support this method yet. 
		        		invocation.setRequestHeader('Accept-Language', mw.config.get('wgServer')+"/wiki/"+contentType);
		                //invocation.setRequestHeader('Content-Type', contentType);
		                
		        		//TODO requires preflight request with OPTIONS method first
		                //invocation.setRequestHeader('X-wgServer', wgServer);
		                //invocation.setRequestHeader('X-wgPageName', contentType);
		                
		                invocation.onreadystatechange = function(responseDetails) {
		                	 if (invocation.readyState == 4){
		     	                if (invocation.status == 200){
			 	                	processResponse();
		     	                }
		                	 }
		                };
		                invocation.send(); 
		        	}
					DeadLinkFinder.counter++;
		        }
		        
		    }
		    
		    //function for processing response
		    function processResponse(){
		    	var redirectOffset = 0;
		    	var wasRedirected = false;
		    	if(DeadLinkFinder.showRedirects==true){
		    		if(invocation.responseText.substring(0,1) == "-"){
		    			wasRedirected = true;
		    			redirectOffset = 1;
		    		}
		    	}
				//extract status code and status message from response
   				var status = invocation.responseText.substring(0+redirectOffset,3+redirectOffset);
				var statusMessage = invocation.responseText.substring(4+redirectOffset);

				//if the status is not ok, set marker
				if (status != 200 && !(!DeadLinkFinder.showUnsupportedProtocol && status == "XX3")) { 
					DeadLinkFinder.deadLinkCount++;
					if(status.length==0){
						status = "XX5";
						statusMessage = "Unknown Script Error";
					}
					//create label
					var alertLabel = document.createElement("span");
					alertLabel.innerHTML = "["+status+"]";
					alertLabel.style.color="#ff0000";
					alertLabel.title=statusMessage;
						alertLabel.id="dead-link-ref-"+DeadLinkFinder.deadLinkCount;
					link.parentNode.insertBefore(alertLabel,link);
					
					//create icon
					var alertImg = document.createElement("img");
					alertImg.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Nuvola_apps_important.svg/16px-Nuvola_apps_important.svg.png";
					alertImg.alt=txts[lang]["alertIconAltSmall"];
					alertImg.title=statusMessage;
					if(DeadLinkFinder.linkToLinkSearch){
						var alertLink = document.createElement("a");
						alertLink.href = encodeURI(mw.config.get('wgServer')+mw.config.get('wgScript')+"?title=Special:LinkSearch&target=")+encodeURIComponent(link.href);
						alertLink.appendChild(alertImg);
						
						//insert label and icon
						link.parentNode.insertBefore(alertLink,alertLabel);
						link.parentNode.insertBefore(link,alertLink);
					}else{
						//insert label and icon
						link.parentNode.insertBefore(alertImg,alertLabel);
						link.parentNode.insertBefore(link,alertImg);
					}

					//if it is the first dead link on this page, show warning icon on the bottom of users screen
					if(DeadLinkFinder.deadLinkCount==1){
						if(DeadLinkFinder.showWaitingIcon){
							var waitingDiv = document.getElementById("waiting-div");
							if(waitingDiv){
								waitingDiv.parentNode.removeChild(waitingDiv);
							}
						}
						
						//insert Icon with count and hide-Option
						var alertDiv = document.createElement("div");
						alertDiv.id = "dead-link-alert-div";
						alertDiv.innerHTML = "<a id=\"dead-link-ref-link\" href=\"#dead-link-ref-0\" onclick=\"DeadLinkFinder.updateLinkRef()\"><img src=\"https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Nuvola_apps_important.svg/50px-Nuvola_apps_important.svg.png\" style=\"float:left;\" alt=\""+txts[lang]["alertIconAltBig"]+"\"></a><small>&nbsp;<a style=\"cursor:pointer\" onclick=\"this.parentNode.parentNode.style.visibility='hidden';\">[x]</a></small><br/><div id=\"dead-link-count\" style=\"float:right; padding-top:4px; color:red;\"></div>";
						alertDiv.style.background = "rgb(255, 255, 255) none repeat scroll 0% 0%"; 			
						alertDiv.style.position = "fixed"; 
						alertDiv.style.bottom = "0px"; 
						alertDiv.style.right = "0px";

						document.getElementById("bodyContent").appendChild(alertDiv);
						DeadLinkFinder.countDiv = document.getElementById("dead-link-count");							
						
						//first dead link was found -> stop browsemode
						if(DeadLinkFinder.browsemode && DeadLinkFinder.browsemode_stopAfterFinding){
							DeadLinkFinder.browsemode = false;
							DeadLinkFinder.setCookie('DeadLinkFinder_browsemode','off',1);
							var browsemodeswitch = document.getElementById("t-browsemode");
							browsemodeswitch.parentNode.removeChild(browsemodeswitch);
							//add new browsemode link
							mw.util.addPortletLink("p-tb","javascript:DeadLinkFinder.startBrowseMode()",txts[lang]["startBrowsemode"], "t-browsemode",txts[lang]["startBrowsemodeDescription"],txts[lang]["stopBrowsemodeKey"],document.getElementById("t-whatlinkshere"));
						}

					}
					//show the current dead link count
					DeadLinkFinder.countDiv.innerHTML = "<small>"+DeadLinkFinder.deadLinkCount+"&nbsp;</small>"; 

				}else if(DeadLinkFinder.showIndividualOK && !(!DeadLinkFinder.showUnsupportedProtocol && status == "XX3")){
					//TODO continue here
					if(DeadLinkFinder.showContentType==true){
						//create label
						var contentTypeLabel = document.createElement("span");
						contentTypeLabel.innerHTML = "["+statusMessage+"]";
						contentTypeLabel.style.color="#009900";
							
						link.parentNode.insertBefore(contentTypeLabel,link.nextSibling);
					}

					//add little OK-Icon after Link
					//create icon
					var okImgSmall = document.createElement("img");
					okImgSmall.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Gnome-emblem-default.svg/14px-Gnome-emblem-default.svg.png";
					okImgSmall.alt=txts[lang]["okIconAltSmall"];
					okImgSmall.title=txts[lang]["okIconTitleSmall"];
					okImgSmall.style.marginLeft = "5px";

					//insert icon
					link.parentNode.insertBefore(okImgSmall,link.nextSibling);

				}
				if(DeadLinkFinder.showRedirects==true && wasRedirected == true){
					//create icon
					var redirectImgSmall = document.createElement("img");
					redirectImgSmall.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Fairytale_right_blue.png/16px-Fairytale_right_blue.png";
					redirectImgSmall.alt=txts[lang]["redirectIconAltSmall"];
					redirectImgSmall.title=txts[lang]["redirectIconTitleSmall"];
					redirectImgSmall.style.marginLeft = "5px";

					//insert icon
					link.parentNode.insertBefore(redirectImgSmall,link.nextSibling);
				}
				//after response has been processed, check the next dead link
				DeadLinkFinder.next(); 
		    }
		    // send re request
		    callOtherDomain();
		    
		}else{
			//no more links to check
			//remove waiting icon if it is shown and if there are no dead links (if there are dead links, it will already have been removed)
			if(DeadLinkFinder.showWaitingIcon && DeadLinkFinder.deadLinkCount==0 ){
				var waitingDiv = document.getElementById("waiting-div");
				waitingDiv.parentNode.removeChild(waitingDiv);
			}
			
			//show OK-Icon if user has requested it
			if(DeadLinkFinder.deadLinkCount==0 && DeadLinkFinder.showOk){
				DeadLinkFinder.okDiv = document.createElement("div");
				DeadLinkFinder.okDiv.innerHTML = "<a style=\"cursor:pointer\" onclick=\"this.parentNode.style.visibility='hidden';\"><img src=\"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Gnome-emblem-default.svg/40px-Gnome-emblem-default.svg.png\" style=\"float:left;\" alt=\""+txts[lang]["noDeadLinks"]+"\"></a>";
				DeadLinkFinder.okDiv.id = "okDiv";
				DeadLinkFinder.okDiv.style.position = "fixed"; 
				DeadLinkFinder.okDiv.style.bottom = "0px"; 
				DeadLinkFinder.okDiv.style.right = "0px";
				DeadLinkFinder.okDiv.style.opacity = "1";
				document.getElementById("bodyContent").appendChild(DeadLinkFinder.okDiv);
				//start the fading timer, if the OK icon should be faded
				if(DeadLinkFinder.fadeOk){
					setTimeout(function(){DeadLinkFinder.fade();}, DeadLinkFinder.fadeOutDelay);
				}
				//select the next random page, if the browsemode is on
				if(DeadLinkFinder.browsemode){
					DeadLinkFinder.jumpToRandomPage();
				}
			}else if(DeadLinkFinder.deadLinkCount>0){
				//set the text color of the dead link counter to black, indicating, that all dead links have been found
				DeadLinkFinder.countDiv.style.color = "black";
				if(DeadLinkFinder.browsemode){
					//stop the browsemode if it as selected, since a dead link has been found
					DeadLinkFinder.browsemode = false;
					DeadLinkFinder.setCookie('DeadLinkFinder_browsemode','off',1);
					var oldLink = document.getElementById("t-browsemode");
					oldLink.parentNode.removeChild(oldLink);
					//add new browsemode link
					mw.util.addPortletLink("p-tb","javascript:DeadLinkFinder.startBrowseMode()",txts[lang]["startBrowsemode"], "t-browsemode",txts[lang]["startBrowsemodeDescription"],txts[lang]["stopBrowsemodeKey"],document.getElementById("t-whatlinkshere"));
						
				}
			}
		}


	},
	
	startAlwaysCheckingForDeadLinks: function(){
		DeadLinkFinder.setCookie('DeadLinkFinder_alwaysCheck','on',30);
		
		var nextElement = document.getElementById("t-whatlinkshere");
		
		var linkAlways = document.getElementById('t-startAlwaysChecking');
		if(linkAlways){
			nextElement = linkAlways.nextSibling;
			linkAlways.parentNode.removeChild(linkAlways);
		}
		
		//only remove link to manually check current page if the namespace is checked automatically 
		if(DeadLinkFinder.checkNamespace()){
			var linkManually = document.getElementById('t-checkManually');
			if(linkManually){
				linkManually.parentNode.removeChild(linkManually);
			}
		}
		//add link to switch off automatic checking
		mw.util.addPortletLink("p-tb","javascript:DeadLinkFinder.stopAlwaysCheckingForDeadLinks()",txts[lang]["stopAlwaysChecking"], "t-stopAlwaysChecking",txts[lang]["stopAlwaysCheckingDescription"],txts[lang]["stopAlwaysCheckingKey"],nextElement);

		if(DeadLinkFinder.checkNamespace()){
			DeadLinkFinder.start();
		}
	},

	stopAlwaysCheckingForDeadLinks: function(){
		DeadLinkFinder.setCookie('DeadLinkFinder_alwaysCheck','off',30);
		
		var nextElement = document.getElementById("t-whatlinkshere");
		
		var linkStopAlways = document.getElementById('t-stopAlwaysChecking');
		if(linkStopAlways){
			nextElement = linkStopAlways.nextSibling;
			linkStopAlways.parentNode.removeChild(linkStopAlways);
		}
		
		//add link to manually start the checking, only if the namespace is checked automatically, otherwise there would be two of those links
		if(DeadLinkFinder.checkNamespace()){
			//add link to check links manually
			mw.util.addPortletLink("p-tb","javascript:DeadLinkFinder.start()",txts[lang]["linkCheckManually"], "t-checkManually",txts[lang]["linkCheckManuallyDescription"],txts[lang]["linkCheckManuallyKey"],nextElement);
		}
		//add link to switch on automatic checking
		mw.util.addPortletLink("p-tb","javascript:DeadLinkFinder.startAlwaysCheckingForDeadLinks()",txts[lang]["startAlwaysChecking"], "t-startAlwaysChecking",txts[lang]["startAlwaysCheckingDescription"],txts[lang]["startAlwaysCheckingKey"],nextElement);
		
	},
	
	//check if the current namespace is in the list of namespaces to be searched automatically
	checkNamespace: function(){
		for(var i=0;i<DeadLinkFinder.namespaceFilter.length;i++){
			if(DeadLinkFinder.namespaceFilter[i]==mw.config.get('wgNamespaceNumber')){
				return true;
			}
		}
		return false;
	},
	
	//add link to check page manually for dead links
	addCheckManuallyLink: function(){
		mw.util.addPortletLink("p-tb","javascript:DeadLinkFinder.start()",txts[lang]["linkCheckManually"], "t-checkManually",txts[lang]["linkCheckManuallyDescription"],txts[lang]["linkCheckManuallyKey"],document.getElementById("t-whatlinkshere"));
		
	},
	
	//the function for slowly fading out the OK-Icon
	fade: function(){
		DeadLinkFinder.okDiv.style.opacity = DeadLinkFinder.okDiv.style.opacity-0.05;
		if(DeadLinkFinder.okDiv.style.opacity <= 0){
			DeadLinkFinder.okDiv.parentNode.removeChild(DeadLinkFinder.okDiv);
			return;
		}else{
			setTimeout(function(){DeadLinkFinder.fade();}, DeadLinkFinder.timeToFade/10);
		}
	},

	//allows to store the current value of the browsemode in a cookie
	setCookie : function(c_name, value, expiredays) {
		//code for this function taken from: www.w3schools.com/js/js_cookies.asp
		var exdate = new Date();
		exdate.setDate(exdate.getDate() + expiredays);
		document.cookie = c_name
				+ "="
				+ escape(value)
				+ ";path=/"
				+ ((expiredays == null) ? "" : ";expires="
						+ exdate.toUTCString());
	},

	//allows to read the current value of the browsemode in a cookie
	getCookie: function(c_name){
		//code for this function taken from: www.w3schools.com/js/js_cookies.asp
	    if (document.cookie.length > 0) {
			c_start = document.cookie.indexOf(c_name + "=");
			if (c_start != -1) {
				c_start = c_start + c_name.length + 1;
				c_end = document.cookie.indexOf(";", c_start);
				if (c_end == -1)
					c_end = document.cookie.length;
				return unescape(document.cookie.substring(c_start, c_end));
			}
		}
		return "";
	},
    
	//changes the link for the big warning icon, to always jump to the next dead link 
	updateLinkRef: function(){
		var a = document.getElementById("dead-link-ref-link");
		var link = a.href;
		var count = (parseInt(link.substring(link.indexOf("#dead-link-ref-")+15)))%DeadLinkFinder.deadLinkCount+1;
		a.href = "#dead-link-ref-"+ count;
	},

	//call the link for a random wiki page
	jumpToRandomPage: function(){
		var link = document.evaluate("id('n-randompage')/a", document, null, 9, null).singleNodeValue;
		if(link){
			window.location = link.href;
		}else{
			DeadLinkFinder.browsemode = false;
			DeadLinkFinder.setCookie('DeadLinkFinder_browsemode','off',1);
		}
	},
    
	wmfLink:function(link){
		for (var i = 0; i < DeadLinkFinder.wmfProjects.length; i++) {   
			if(link.toString().match(DeadLinkFinder.wmfProjects[i])){
				return true;
			}
		}
		return false;
	},
    
	startBrowseMode: function(){
		DeadLinkFinder.browsemode = true;
		DeadLinkFinder.setCookie('DeadLinkFinder_browsemode','on',1);
		DeadLinkFinder.jumpToRandomPage();
	},
    
	stopBrowseMode: function(){
		DeadLinkFinder.browsemode = false;
		DeadLinkFinder.setCookie('DeadLinkFinder_browsemode','off',1);
		var browsemodeswitch = document.getElementById("t-browsemode");
		browsemodeswitch.parentNode.removeChild(browsemodeswitch);
		//add new browsemode link
		mw.util.addPortletLink("p-tb","javascript:DeadLinkFinder.startBrowseMode()",txts[lang]["startBrowsemode"], "t-browsemode",txts[lang]["startBrowsemodeDescription"],txts[lang]["stopBrowsemodeKey"],document.getElementById("t-whatlinkshere"));
		
		if(DeadLinkFinder.checkDeadLinksCookie){
			if(DeadLinkFinder.checkNamespace()&&(mw.config.get('wgIsArticle')|mw.config.get('wgAction')=="submit")){
				start = true;
			}else{
				//set manual check link
				DeadLinkFinder.addCheckManuallyLink();
			}
			//add link to switch off automatic checking
			mw.util.addPortletLink("p-tb","javascript:DeadLinkFinder.stopAlwaysCheckingForDeadLinks()",txts[lang]["stopAlwaysChecking"], "t-stopAlwaysChecking",txts[lang]["stopAlwaysCheckingDescription"],txts[lang]["stopAlwaysCheckingKey"],document.getElementById("t-whatlinkshere"));
			
		}else{
			//set manual check link
			DeadLinkFinder.addCheckManuallyLink();
			//add link to switch on automatic checking
			mw.util.addPortletLink("p-tb","javascript:DeadLinkFinder.startAlwaysCheckingForDeadLinks()",txts[lang]["startAlwaysChecking"], "t-startAlwaysChecking",txts[lang]["startAlwaysCheckingDescription"],txts[lang]["startAlwaysCheckingKey"],document.getElementById("t-whatlinkshere"));
			
		}
	}

};

//start to find the links, once the page is loaded
jQuery( function( $ ) {
	DeadLinkFinder.init()
});
