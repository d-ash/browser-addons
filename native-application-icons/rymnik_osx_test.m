#include <stdio.h>
#include <stdlib.h>
#include <dlfcn.h>

#include "rymnik_osx.h"

typedef int		( * FUNC_Init )();
typedef int		( * FUNC_SaveIconsForFileExt )( const char*, const char* );

#define ITER	1000

int main() {
	int			retVal = EXIT_FAILURE;
	int			i = ITER;
	void*		lib;
	char*		error;
	FUNC_Init					r_Init;
	FUNC_SaveIconsForFileExt	r_SaveIconsForFileExt;

	lib = dlopen( "./librymnik_osx.dylib", RTLD_LAZY );
	if ( lib == NULL ) {
		printf( "Cannot load a library.\n" );
		goto L_end;
	}

	dlerror();
	r_Init = ( FUNC_Init ) dlsym( lib, "rymnik_Init" );
	error = dlerror();
	if ( error != NULL ) {
		printf( "Cannot get a function: %s\n", error );
		goto L_endFreeDll;
	}

	dlerror();
	r_SaveIconsForFileExt = ( FUNC_SaveIconsForFileExt ) dlsym( lib, "rymnik_SaveIconsForFileExt" );
	error = dlerror();
	if ( error != NULL ) {
		printf( "Cannot get a function: %s\n", error );
		goto L_endFreeDll;
	}

	if ( ( *r_Init )() == 0 ) {
		printf( "Init() call failed.\n" );
		goto L_endFreeDll;
	}

	// ===========================

	while ( i-- > 0 ) {
		if ( !( *r_SaveIconsForFileExt )( "txt", "." ) ) {
			printf( "Error on %d iteration (count down).\n", i );
			goto L_endFreeDll;
		}
	}
	retVal = EXIT_SUCCESS;

L_endFreeDll:
	dlclose( lib );
L_end:
	return retVal;
}
