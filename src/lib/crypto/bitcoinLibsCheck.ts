
/**
 * Bitcoin library initialization and status checking
 * This file is kept for backward compatibility and re-exports functionality from the new modular structure
 */

export { 
  checkBitcoinLibsLoaded, 
  isLibrariesLoaded,
  checkAndLogLibraryStatus,
  mapLibraryAliases,
  refreshLibraryReferences,
  checkRequiredLibraries,
  handleMissingLibraries
} from './bitcoin-libs';

export type { BitcoinLibsCheckResult } from './bitcoin-libs';
