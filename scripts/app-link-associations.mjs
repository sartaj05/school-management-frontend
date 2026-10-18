import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export function associations({host, fingerprint, teamId, packageId='com.wis.vidyasetu', bundleId='com.wis.vidyasetu'}) {
  if(!/^(?!.*(?:example|invalid|localhost))(?=.{4,253}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(host||'') || host.includes('..')) throw new Error('Supply the real HTTPS hostname, without scheme, port or path.')
  if(!/^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/i.test(fingerprint||'')) throw new Error('Supply the Android release certificate SHA-256 fingerprint (32 colon-separated bytes).')
  if(!/^[A-Z0-9]{10}$/.test(teamId||'')) throw new Error('Supply the ten-character Apple Team ID.')
  for(const id of [packageId,bundleId]) if(!/^[A-Za-z][\w]*(?:\.[A-Za-z][\w]*)+$/.test(id)) throw new Error('Invalid application identifier.')
  return {
    'assetlinks.json':[{relation:['delegate_permission/common.handle_all_urls'],target:{namespace:'android_app',package_name:packageId,sha256_cert_fingerprints:[fingerprint.toUpperCase()]}}],
    'apple-app-site-association':{applinks:{apps:[],details:[{appID:`${teamId}.${bundleId}`,paths:['/app/*','/verify-document/*']}]}}
  }
}

if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const data=associations({host:process.env.APP_LINK_HOST,fingerprint:process.env.ANDROID_RELEASE_SHA256,teamId:process.env.APPLE_TEAM_ID})
    const output=resolve(process.argv[2] || 'public/.well-known');mkdirSync(output,{recursive:true})
    for(const [name,value] of Object.entries(data))writeFileSync(resolve(output,name),JSON.stringify(value,null,2)+'\n')
    console.log(`Generated association files in ${output}. Serve both as application/json over HTTPS without redirects.`)
  } catch(error){console.error(error.message);process.exitCode=1}
}
