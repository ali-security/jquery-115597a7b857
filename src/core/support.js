define([
	"../var/support"
], function( support ) {

support.createHTMLDocument = (function() {
	var body,
		implementation = document.implementation;

	// Support: IE<9, Android<3.0
	// document.implementation.createHTMLDocument is not supported;
	// fall back to the current document in that case.
	if ( !implementation || !implementation.createHTMLDocument ) {
		return false;
	}

	// Support: Safari 8+
	// In Safari 8 documents created via document.implementation.createHTMLDocument
	// collapse sibling forms: the second one becomes a child of the first one.
	// Because of that, this security measure has to be disabled in Safari 8.
	// https://bugs.webkit.org/show_bug.cgi?id=137337
	body = implementation.createHTMLDocument( "" ).body;
	body.innerHTML = "<form></form><form></form>";
	return body.childNodes.length === 2;
})();

return support;

});
