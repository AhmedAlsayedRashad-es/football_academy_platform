/**
 * Data Population Service
 * Runs the comprehensive data seeding script
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function populateComprehensiveData(): Promise<{
  success: boolean;
  message: string;
  output?: string;
}> {
  try {
    const scriptPath = path.join(process.cwd(), 'seed-comprehensive-data.mjs');
    
    const { stdout, stderr } = await execAsync(`node ${scriptPath}`, {
      cwd: process.cwd(),
      timeout: 120000, // 2 minutes timeout
    });

    if (stderr && !stderr.includes('DeprecationWarning')) {
      console.error('Script stderr:', stderr);
    }

    return {
      success: true,
      message: 'Data population completed successfully',
      output: stdout,
    };
  } catch (error: any) {
    console.error('Data population error:', error);
    return {
      success: false,
      message: error.message || 'Failed to populate data',
      output: error.stdout || error.stderr,
    };
  }
}
