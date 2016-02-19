#ifndef _RYMNIK_WINDOWS_H
#define _RYMNIK_WINDOWS_H

/**
 * All exported functions accept UTF8 encoded strings.
 */

#ifdef _RYMNIK_WINDOWS_COMPILING
  #define LIBSPEC __declspec( dllexport )
#else
  #define LIBSPEC __declspec( dllimport )
#endif

/**
 * Don't use __stdcall calling convention.
 * It mangles names (it works correctly with .DEF file only).
 */
#define CALLSPEC __cdecl

#include <windows.h>

LIBSPEC int CALLSPEC	rymnik_Init();
LIBSPEC int CALLSPEC	rymnik_SaveIconsForFileExt( const char* const extension, const char* const outputDir );

#endif
