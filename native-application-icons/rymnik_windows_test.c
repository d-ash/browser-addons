#include <windows.h>
#include <stdio.h>

typedef int		( __cdecl * FUNC_Init )();
typedef int		( __cdecl * FUNC_SaveIconsForFileExt )( const char*, const char* );

#define ITER	100000

int main() {
	int			retVal = EXIT_FAILURE;
	int			i = ITER;
	HMODULE		dll;
	FUNC_Init					r_Init;
	FUNC_SaveIconsForFileExt	r_SaveIconsForFileExt;

	dll = LoadLibrary( "rymnik_windows.dll" );
	if ( dll == NULL ) {
		printf( "Cannot load a library.\n" );
		goto L_end;
	}

	r_Init = ( FUNC_Init ) GetProcAddress( dll, "rymnik_Init" );
	if ( !r_Init ) {
		printf( "Cannot get a function.\n" );
		goto L_endFreeDll;
	}

	r_SaveIconsForFileExt = ( FUNC_SaveIconsForFileExt ) GetProcAddress( dll, "rymnik_SaveIconsForFileExt" );

	if ( !r_SaveIconsForFileExt ) {
		printf( "Cannot get a function.\n" );
		goto L_endFreeDll;
	}

	if ( ( *r_Init )() == 0 ) {
		printf( "Init() call failed.\n" );
		goto L_endFreeDll;
	}

	// ===========================

	while ( i-- > 0 ) {
		if ( !( *r_SaveIconsForFileExt )( "cpp", "." ) ) {
			printf( "Error on %d iteration (count down).\n", i );
			goto L_endFreeDll;
		}
	}
	/*
	i = ITER;
	while ( i-- > 0 ) {
		if ( !( *r_SaveIconsForFileExt )( "ini", "." ) ) {
			printf( "Error on %d iteration (count down).\n", i );
			goto L_endFreeDll;
		}
	}
	*/
	retVal = EXIT_SUCCESS;

L_endFreeDll:
	FreeLibrary( dll );
L_end:
	return retVal;
}
