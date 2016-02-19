#ifndef _RYMNIK_LINUX_H
#define _RYMNIK_LINUX_H

/**
 * All exported functions accept UTF8 encoded strings.
 */

int		rymnik_Init();
int		rymnik_SaveIconsForFileExt( const char* const extension, const char* const outputDir );

#endif
