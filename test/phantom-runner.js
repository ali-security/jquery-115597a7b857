/**
 * Headless runner for the jQuery QUnit suite.
 *
 * jQuery 1.11 has no CLI test task — the suite is `test/index.html`, driven by a
 * real browser against a PHP-serving host (see "Running the Unit Tests" in
 * README.md). This drives it with PhantomJS so CI can run it, streaming every
 * test as it finishes and exiting non-zero on any failure.
 *
 * Usage: phantomjs test/phantom-runner.js <url-of-test/index.html>
 */
/* jshint node: true */
/* global phantom: false */

var system = require( "system" ),
	page = require( "webpage" ).create(),
	url = system.args[ 1 ],
	// The suite runs several hundred tests through iframes; PhantomJS needs
	// well over the default Travis 10-minute silence budget without progress.
	TIMEOUT = 20 * 60 * 1000,
	POLL = 500,
	started = new Date().getTime(),
	reported = 0;

if ( !url ) {
	console.log( "usage: phantomjs test/phantom-runner.js <url>" );
	phantom.exit( 2 );
}

page.onError = function( msg ) {
	console.log( "page error: " + msg );
};

// Collect the finished-test list the page has produced since the last poll.
function drain() {
	return page.evaluate( function( from ) {
		var i, li, name, module,
			out = [],
			items = document.querySelectorAll( "#qunit-tests > li" ),
			result = document.getElementById( "qunit-testresult" );

		for ( i = from; i < items.length; i++ ) {
			li = items[ i ];
			// A test only gets pass/fail once it has finished running.
			if ( li.className !== "pass" && li.className !== "fail" ) {
				break;
			}
			module = li.querySelector( ".module-name" );
			name = li.querySelector( ".test-name" );
			out.push( ( li.className === "fail" ? "FAIL " : "ok   " ) +
				( module ? module.textContent + ": " : "" ) +
				( name ? name.textContent : "(unnamed)" ) );
		}

		return {
			lines: out,
			seen: from + out.length,
			total: items.length,
			done: !!result && /completed/.test( result.textContent ),
			summary: result ? result.textContent : "",
			failed: result ?
				Number( ( result.querySelector( ".failed" ) || {} ).textContent || 0 ) :
				0
		};
	}, reported );
}

function finish( state ) {
	console.log( "" );
	console.log( "jQuery test suite: " + state.total + " tests run" );
	console.log( state.summary );
	if ( state.failed > 0 ) {
		console.log( "RESULT: FAILED (" + state.failed + " failed assertions)" );
		phantom.exit( 1 );
	}
	console.log( "RESULT: PASSED" );
	phantom.exit( 0 );
}

function poll() {
	var state = drain();

	for ( var i = 0; i < state.lines.length; i++ ) {
		console.log( state.lines[ i ] );
	}
	reported = state.seen;

	if ( state.done ) {
		finish( state );
		return;
	}
	if ( new Date().getTime() - started > TIMEOUT ) {
		console.log( "RESULT: TIMED OUT after " + reported + " tests" );
		phantom.exit( 1 );
		return;
	}
	setTimeout( poll, POLL );
}

console.log( "loading " + url );
page.open( url, function( status ) {
	if ( status !== "success" ) {
		console.log( "RESULT: FAILED to load " + url );
		phantom.exit( 1 );
		return;
	}
	poll();
} );
