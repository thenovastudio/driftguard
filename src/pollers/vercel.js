import { logger } from '../logger.js';

export async function pollVercel() {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) {
    logger.warn('VERCEL_API_TOKEN not set, skipping');
    return { skipped: true };
  }
  
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  try {
    // Fetch projects
    const projectsRes = await fetch('https://api.vercel.com/v9/projects?limit=50', { headers });
    const projects = await projectsRes.json();
    
    const projectConfigs = [];
    
    for (const project of projects.projects || []) {
      // Get env vars for each project
      const envRes = await fetch(
        `https://api.vercel.com/v9/projects/${project.id}/env`,
        { headers }
      );
      const envs = await envRes.json();
      
      projectConfigs.push({
        id: project.id,
        name: project.name,
        framework: project.framework,
        node_version: project.nodeVersion,
        build_command: project.buildCommand,
        output_directory: project.outputDirectory,
        env_vars: (envs.envs || []).map(e => ({
          key: e.key,
          type: e.type,
          target: e.target,
          // Don't store actual values for security
          has_value: !!e.value,
        })),
        domains: project.alias || [],
        protection: project.protection,
      });
    }
    
    return {
      projects: projectConfigs,
      team: projects.projects?.[0]?.accountId || null,
    };
  } catch (error) {
    logger.error(`Vercel poll failed: ${error.message}`);
    throw error;
  }
}
