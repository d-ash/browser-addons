#include "rymnik_linux.h"

//#define _RYMNIK_LINUX_DEBUG

#ifdef _RYMNIK_LINUX_DEBUG
  #define PLOG( ... )	do { fprintf( stderr, __VA_ARGS__ ); } while ( 0 );
#else
  #define PLOG( ... )	do {} while ( 0 );
#endif

int rymnik_Init() {
	return 0;
}

int rymnik_SaveIconsForFileExt( const char* const extension, const char* const outputDir ) {
	return 0;
}
