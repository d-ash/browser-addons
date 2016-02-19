/**
 * Compile with '-fvisibility=hidden'.
 */

#import <AppKit/AppKit.h>
#import <stdio.h> 

#define EXPORT __attribute__( ( visibility( "default" ) ) )

static const NSString* const	outputUTI = @"public.png";	// com.microsoft.ico
static const NSString* const	outputExt = @"png";

EXPORT int rymnik_Init() {
	return 1;
}

EXPORT int rymnik_SaveIconsForFileExt( const char* const extension, const char* const outputDir ) {
	int			retVal = 0;
	NSInteger	bigWidth = 65535;			// big enough
	NSImage*	icon = nil;
	NSString*	ext;
	NSString*	dir;
	NSString*	path;
	NSURL*		url;
	CGImageRef	imgSma = nil;
	CGImageRef	imgMid = nil;
	CGImageRef	imgBig = nil;
	CGImageDestinationRef	imgDestSma;
	CGImageDestinationRef	imgDestMid;
	CGImageDestinationRef	imgDestBig;
	NSBitmapImageRep*		rep;

	ext = [ [ NSString alloc ] initWithUTF8String: extension ];
	dir = [ [ NSString alloc ] initWithUTF8String: outputDir ];

	icon = [ [ NSWorkspace sharedWorkspace ] iconForFileType: ext ];
	if ( icon == nil ) {
		goto L_endExtDir;
	}

	path = [ dir stringByAppendingFormat: @"/%@_sma.%@", ext, outputExt ];
	url = [ NSURL fileURLWithPath: path ];
	imgDestSma = CGImageDestinationCreateWithURL( ( CFURLRef ) url, ( CFStringRef ) outputUTI, 1, NULL);
	[ url release ];
	[ path release ];

	path = [ dir stringByAppendingFormat: @"/%@_mid.%@", ext, outputExt ];
	url = [ NSURL fileURLWithPath: path ];
	imgDestMid = CGImageDestinationCreateWithURL( ( CFURLRef ) url, ( CFStringRef ) outputUTI, 1, NULL);
	[ url release ];
	[ path release ];

	path = [ dir stringByAppendingFormat: @"/%@_big.%@", ext, outputExt ];
	url = [ NSURL fileURLWithPath: path ];
	imgDestBig = CGImageDestinationCreateWithURL( ( CFURLRef ) url, ( CFStringRef ) outputUTI, 1, NULL);
	[ url release ];
	[ path release ];

	for ( rep in icon.representations ) {
		if ( rep.pixelsWide == 16 ) {
			imgSma = rep.CGImage;
			continue;
		}
		if ( rep.pixelsWide == 32 ) {
			imgMid = rep.CGImage;
			continue;
		}
		// looking for an image wider than 32 and narrower than previously visited
		if ( rep.pixelsWide > 32 && rep.pixelsWide < bigWidth ) {
			imgBig = rep.CGImage;
			bigWidth = rep.pixelsWide;
			continue;
		}
	}

	if ( imgSma != nil ) {
		CGImageDestinationAddImage( imgDestSma, imgSma, NULL );
		CGImageDestinationFinalize( imgDestSma );
	}
	if ( imgMid != nil ) {
		CGImageDestinationAddImage( imgDestMid, imgMid, NULL );
		CGImageDestinationFinalize( imgDestMid );
	}
	if ( imgBig != nil ) {
		CGImageDestinationAddImage( imgDestBig, imgBig, NULL );
		CGImageDestinationFinalize( imgDestBig );
	}

	retVal = 1;
	[ icon release ];
L_endExtDir:
	[ ext release ];
	[ dir release ];
	return retVal;
}
