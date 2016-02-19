#define _RYMNIK_WINDOWS_COMPILING
#include "rymnik_windows.h"
#undef _RYMNIK_WINDOWS_COMPILING

#include <wingdi.h>
#include <stdint.h>
#include <stdio.h>
#include <objbase.h>
#include <commctrl.h>
#include <commoncontrols.h>

//#define _RYMNIK_WINDOWS_DEBUG

#ifdef _RYMNIK_WINDOWS_DEBUG
  #define PLOG( ... )	do { fprintf( stderr, __VA_ARGS__ ); } while ( 0 );
#else
  #define PLOG( ... )	do {} while ( 0 );
#endif

/*
 *	About icons: http://msdn.microsoft.com/en-us/library/ms997538.aspx
 */

static HIMAGELIST	_imageListSma;
static HIMAGELIST	_imageListMid;
static HIMAGELIST	_imageListBig;

static wchar_t*		_ConvertToUTF16( const char* const utf8Input );
static int			_SaveIcon( const HICON icon, const wchar_t* const path );

int CALLSPEC rymnik_Init() {
	/*
	 *	These initializations should be held outside.
	 *
	INITCOMMONCONTROLSEX	icex;

	// Ensure that comctl32.dll is loaded
	icex.dwSize = sizeof( INITCOMMONCONTROLSEX );
	icex.dwICC = 0;
	if ( !InitCommonControlsEx( &icex ) ) {
		PLOG( "InitCommonControlsEx\n" );
		return 0;
	}

	if ( CoInitializeEx( NULL, COINIT_MULTITHREADED ) != S_OK ) {
		PLOG( "CoInitializeEx\n" );
		return 0;
	}
	*/

	if ( SHGetImageList( SHIL_SMALL, &IID_IImageList, ( void** )&_imageListSma ) != S_OK ) {
		PLOG( "SHGetImageList-0\n" );
		return 0;
	}
	if ( SHGetImageList( SHIL_LARGE, &IID_IImageList, ( void** )&_imageListMid ) != S_OK ) {
		PLOG( "SHGetImageList-1\n" );
		return 0;
	}
	if ( SHGetImageList( SHIL_EXTRALARGE, &IID_IImageList, ( void** )&_imageListBig ) != S_OK ) {
		PLOG( "SHGetImageList-2\n" );
		return 0;
	}

	return 1;
}

int CALLSPEC rymnik_SaveIconsForFileExt( const char* const extension, const char* const outputDir ) {
	static const wchar_t	dummyPrefix[] = L"dummy.";
	int				retVal = 0;
	wchar_t*		extensionUTF16;
	wchar_t*		outputDirUTF16;
	wchar_t*		outputFilename;
	size_t			outputFilenameLen;
	wchar_t*		dummy;
	size_t			dummySize;
	SHFILEINFOW		sfi;
	HICON			hIcon;

	extensionUTF16 = _ConvertToUTF16( extension );
	if ( extensionUTF16 == NULL ) {
		PLOG( "extensionUTF16\n" );
		goto L_end;
	}
	outputDirUTF16 = _ConvertToUTF16( outputDir );
	if ( outputDirUTF16 == NULL ) {
		PLOG( "outputDirUTF16\n" );
		goto L_endFreeExtString;
	}
	outputFilenameLen = wcslen( outputDirUTF16 ) + wcslen( extensionUTF16 ) + 9;
	outputFilename = malloc( ( outputFilenameLen + 1 ) * sizeof( wchar_t ) ); 

	dummySize = wcslen( dummyPrefix ) + wcslen( extensionUTF16 ) + 1;
	dummy = malloc( ( dummySize ) * sizeof( wchar_t ) );
	swprintf( dummy, dummySize, L"%s%s", dummyPrefix, extensionUTF16 );
	if ( SHGetFileInfoW( dummy, FILE_ATTRIBUTE_NORMAL, &sfi, sizeof( sfi ),
				SHGFI_USEFILEATTRIBUTES | SHGFI_SYSICONINDEX ) == 0 ) {
		PLOG( "SHGetFileInfoW\n" );
		free( dummy );
		goto L_endFreeStrings;
	}
	free( dummy );

	// 16x16
	hIcon = ImageList_GetIcon( _imageListSma, sfi.iIcon, ILD_TRANSPARENT );
	if ( hIcon == NULL ) {
		PLOG( "GetIcon-0\n" );
		goto L_endFreeStrings;
	}
	swprintf( outputFilename, outputFilenameLen + 1, L"%s\\%s_sma.ico", outputDirUTF16, extensionUTF16 );
    if ( _SaveIcon( hIcon, outputFilename ) == 0 ) {
		PLOG( "_SaveIcon-0\n" );
		goto L_endFreeStrings;
	}
	if ( !DestroyIcon( hIcon ) ) {
		PLOG( "DestroyIcon-0\n" );
		goto L_endFreeStrings;
	}

	// 32x32 (can be 48x48 if user has set "Use large icons")
	hIcon = ImageList_GetIcon( _imageListMid, sfi.iIcon, ILD_TRANSPARENT );
	if ( hIcon == NULL ) {
		PLOG( "GetIcon-1\n" );
		goto L_endFreeStrings;
	}
	swprintf( outputFilename, outputFilenameLen + 1, L"%s\\%s_mid.ico", outputDirUTF16, extensionUTF16 );
    if ( _SaveIcon( hIcon, outputFilename ) == 0 ) {
		PLOG( "_SaveIcon-1\n" );
		goto L_endFreeStrings;
	}
	if ( !DestroyIcon( hIcon ) ) {
		PLOG( "DestroyIcon-1\n" );
		goto L_endFreeStrings;
	}

	// 48x48 (can be other sizes)
	hIcon = ImageList_GetIcon( _imageListBig, sfi.iIcon, ILD_TRANSPARENT );
	if ( hIcon == NULL ) {
		PLOG( "GetIcon-2\n" );
		goto L_endFreeStrings;
	}
	swprintf( outputFilename, outputFilenameLen + 1, L"%s\\%s_big.ico", outputDirUTF16, extensionUTF16 );
    if ( _SaveIcon( hIcon, outputFilename ) == 0 ) {
		PLOG( "_SaveIcon-2\n" );
		goto L_endFreeStrings;
	}
	if ( !DestroyIcon( hIcon ) ) {
		PLOG( "DestroyIcon-2\n" );
		goto L_endFreeStrings;
	}

	retVal = 1;
L_endFreeStrings:
	free( outputFilename );
	free( outputDirUTF16 );
L_endFreeExtString:
	free( extensionUTF16 );
L_end:
	return retVal;
}

static wchar_t* _ConvertToUTF16( const char* const utf8Input ) {
	wchar_t*	buf = NULL;
	int			len;

	// Get required size of a destination buffer.
	len = MultiByteToWideChar( CP_UTF8, 0, utf8Input, -1, buf, 0 );
	if ( len == 0 ) {
		PLOG( "MultiByteToWideChar-len\n" );
		return NULL;
	}
	buf = malloc( len * sizeof( wchar_t ) );	// terminating null was counted already
	if ( MultiByteToWideChar( CP_UTF8, 0, utf8Input, -1, buf, len ) == 0 ) {
		PLOG( "MultiByteToWideChar-buf\n" );
		free( buf );
		return NULL;
	}
	return buf;
}

static int _SaveIcon( const HICON icon, const wchar_t* const path ) {
	static const int		bpp = 32;
	static const uint8_t	fileHeader[ 6 ] = { 0, 0, 1, 0, 1, 0 };
	BITMAPINFOHEADER		icHeader = { 0 };
	int			retVal = 0;
	FILE*		f;
	uint8_t		entry[ 16 ];
	HDC			hdc;
	ICONINFO	iconInfo;
	BITMAP		bmp;
	BITMAPINFO	colorBitmapInfo = { 0 };
	uint8_t*	colorBits;
	uint32_t	colorBitsLen;
	BITMAPINFO*	maskBitmapInfo;	// Pointer, because we must allocate memory for color table also!
	uint8_t*	maskBits;
	uint32_t	maskBitsLen;
	int			gdb;			// GetDIBits results

	if ( _wfopen_s( &f, path, L"wb" ) != 0 ) {
		PLOG( "_wfopen_s\n" );
		goto L_end;
	}

	if ( fwrite( fileHeader, sizeof( fileHeader ), 1, f ) == 0 ) {
		PLOG( "fwrite-fileHeader\n" );
		goto L_endFile;
	}

	hdc = GetDC( NULL );
	GetIconInfo( icon, &iconInfo );
	if ( GetObject( iconInfo.hbmColor, sizeof( BITMAP ), &bmp ) == 0 ) {
		PLOG( "fwrite-fileHeader\n" );
		goto L_endIconInfo;
	}

	/*	XOR mask (not bitwise)
	 *	A buffer must be DWORD-aligned, so the size is computed in a crazy way.
	 *	This size can be taken from a additional call to GetDIBits() with NULL pointer.
	 *	But lets count it by ourselves.
	 */
	colorBitsLen = ( ( ( bmp.bmWidth * bpp + 31) & ~31 ) >> 3 ) * bmp.bmHeight;
	colorBits = malloc( colorBitsLen );
	colorBitmapInfo.bmiHeader.biSize = sizeof( BITMAPINFOHEADER );
	colorBitmapInfo.bmiHeader.biWidth = bmp.bmWidth;
	colorBitmapInfo.bmiHeader.biHeight = bmp.bmHeight;
	colorBitmapInfo.bmiHeader.biPlanes = 1;
	colorBitmapInfo.bmiHeader.biBitCount = bpp;
	colorBitmapInfo.bmiHeader.biCompression = BI_RGB;
	gdb = GetDIBits( hdc, iconInfo.hbmColor, 0, bmp.bmHeight, colorBits, &colorBitmapInfo, DIB_RGB_COLORS );
	if ( gdb == 0 || gdb == ERROR_INVALID_PARAMETER ) {
		PLOG( "GetDIBits-0\n" );
		goto L_endColorBits;
	}

	/*	AND mask of the icon (1 bit per pixel).
	 */
	maskBitsLen = ( ( ( bmp.bmWidth + 31) & ~31 ) >> 3 ) * bmp.bmHeight;
	maskBits = malloc( maskBitsLen );
	maskBitmapInfo = malloc( sizeof( BITMAPINFOHEADER ) + 2 * sizeof( RGBQUAD ) );
	memset( maskBitmapInfo, 0, sizeof( BITMAPINFOHEADER ) + 2 * sizeof( RGBQUAD ) );
	maskBitmapInfo->bmiHeader.biSize = sizeof( BITMAPINFOHEADER );
	maskBitmapInfo->bmiHeader.biWidth = bmp.bmWidth;
	maskBitmapInfo->bmiHeader.biHeight = bmp.bmHeight;
	maskBitmapInfo->bmiHeader.biPlanes = 1;
	maskBitmapInfo->bmiHeader.biBitCount = 1;
	maskBitmapInfo->bmiHeader.biCompression = BI_RGB;
	gdb = GetDIBits( hdc, iconInfo.hbmMask, 0, bmp.bmHeight, maskBits, maskBitmapInfo, DIB_RGB_COLORS );
	if ( gdb == 0 || gdb == ERROR_INVALID_PARAMETER ) {
		PLOG( "GetDIBits-0\n" );
		goto L_endMask;
	}

	entry[ 0 ] = bmp.bmWidth;
	entry[ 1 ] = bmp.bmHeight;
	entry[ 2 ] = 0;									// number of colors in a palette, 0 if no palette
	entry[ 3 ] = 0;									// reserved, should be 0
	* ( uint16_t* ) &( entry[ 4 ] ) = 1;			// color planes
	* ( uint16_t* ) &( entry[ 6 ] ) = bpp;			// bits per pixel
	* ( uint32_t* ) &( entry[ 8 ] ) = sizeof( BITMAPINFOHEADER ) + colorBitsLen + maskBitsLen;	// data length in bytes
	* ( uint32_t* ) &( entry[ 12 ] ) = sizeof( fileHeader ) + sizeof( entry );	// offset of data from beginning of file
	fwrite( entry, sizeof( entry ), 1, f );

	// Write DIB header.
	icHeader.biSize = sizeof( BITMAPINFOHEADER );
	icHeader.biWidth = bmp.bmWidth;
	icHeader.biHeight = bmp.bmHeight * 2;			// combined height of AND and XOR masks
	icHeader.biPlanes = 1;
	icHeader.biBitCount = bpp;
	icHeader.biSizeImage = 0;						// can be set to 0 for BI_RGB
	fwrite( &icHeader, sizeof( BITMAPINFOHEADER ), 1, f );

	fwrite( colorBits, colorBitsLen, 1, f );
	fwrite( maskBits, maskBitsLen, 1, f );

	retVal = 1;
L_endMask:
	free( maskBits );
	free( maskBitmapInfo );
L_endColorBits:
	free( colorBits );
L_endIconInfo:
	DeleteObject( iconInfo.hbmColor );
	DeleteObject( iconInfo.hbmMask );
	ReleaseDC( NULL, hdc );
L_endFile:
	fclose( f );
L_end:
	return retVal;
}
