#!/usr/bin/env node
/** Original Worthly cue “A Little Time”: acoustic piano, 84 BPM, C major.
 * Real Salamander Grand Piano recordings (Alexander Holm, CC BY 3.0) replace
 * the old drone and bells. Offline rendering uses only Node and ffmpeg.
 * Credits and publication attribution: audio-sources/salamander/ATTRIBUTION.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {FPS,TOTAL_FRAMES} from '../src/timeline.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
const argument=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const output=path.resolve(root,argument('--out','public/audio/worthly-score.wav'));
const targetLufs=Number(argument('--target-lufs','-16'));
const trimDb=Number(argument('--gain-db','0'));
if(trimDb>0)throw new Error('Positive trim invalidates peak ceiling; change target LUFS instead.');
const sr=48000,duration=TOTAL_FRAMES/FPS,bpm=84,beat=60/bpm,frames=Math.round(duration*sr);
const samples=new Map(),instruments=path.join(root,'audio-sources','salamander');
const scratch=path.join(root,'.remotion','music');
fs.mkdirSync(scratch,{recursive:true});fs.mkdirSync(path.dirname(output),{recursive:true});
const run=(parameters,options={})=>{
  const result=spawnSync('ffmpeg',['-hide_banner',...parameters],{maxBuffer:256*1024*1024,...options});
  if(result.status!==0)throw new Error(String(result.stderr));return result;
};
for(let octave=2;octave<=5;octave++)for(const[name,offset]of[['C',0],['D#',3],['F#',6],['A',9]]){
  if(octave===2&&name!=='A')continue;
  const source=path.join(instruments,`${name}${octave}v6.flac`);
  if(!fs.existsSync(source))throw new Error(`Restore missing sample using scripts/fetch-piano-samples.py: ${source}`);
  const decoded=run(['-i',source,'-t','8','-ar',String(sr),'-ac','2','-f','f32le','-']);
  samples.set((octave+1)*12+offset,new Float32Array(decoded.stdout.buffer,decoded.stdout.byteOffset,decoded.stdout.byteLength/4));
}
const roots=[...samples.keys()],mix=new Float32Array(frames*2),notes=[];
let randomState=1042026;
const random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
const smooth=x=>{const v=Math.max(0,Math.min(1,x));return v*v*(3-2*v);};
function note(bar,offset,midi,length=1,strength=.70,voice='melody'){
  const t=.25+(bar*4+offset)*beat+(random()-.5)*.022,hold=length*beat;
  const nearest=roots.reduce((best,candidate)=>Math.abs(candidate-midi)<Math.abs(best-midi)?candidate:best);
  const sample=samples.get(nearest),ratio=2**((midi-nearest)/12),release=voice==='bass'?1.45:1.15;
  const count=Math.min(Math.floor(sample.length/2/ratio)-1,Math.floor((hold+release)*sr));
  const at=Math.round(t*sr),gain=strength**1.35*(.98+.04*random());
  for(let i=0;i<count&&at+i<frames;i++){
    if(at+i<0)continue;
    const position=i*ratio,index=Math.floor(position),fraction=position-index,elapsed=i/sr;
    const envelope=elapsed>hold?Math.exp(-4.8*(elapsed-hold)/release)*(1-smooth((elapsed-hold)/release)):1;
    for(let channel=0;channel<2;channel++){
      const value=sample[index*2+channel]*(1-fraction)+sample[(index+1)*2+channel]*fraction;
      mix[(at+i)*2+channel]+=value*gain*envelope;
    }
  }
  notes.push({t:+t.toFixed(4),midi,duration:+hold.toFixed(4),strength,voice,sample:nearest});
}
// Moving slash bass and narrow voicings support the melody without crowding.
const chords={C:[48,[55,60,64]],CE:[52,[55,60,64]],Am:[45,[55,60,64]],F:[53,[57,60,64]],G:[43,[55,59,62]],Dm:[50,[57,60,65]],C9:[48,[55,62,64]]};
const progression=['C','F','C','CE','Am','G','F','CE','Dm','G','C','CE','Am','F','Dm','G','F','G','C','CE','Am','G','F','CE','Dm','G','F','C9'];
// Explicit melody: introduction, question/answer, contrasting phrase, return,
// and a quiet cadence. Each entry is beat offset, MIDI note, held beats.
const melody=[
 [[0,64,1],[1.25,67,.7],[2.25,72,1.1]],[[.5,69,1],[2,67,.8],[3,64,.6]],
 [[0,72,.8],[1,74,.5],[1.75,76,1.25],[3.25,74,.6]],[[0,72,1],[1.5,67,.8],[3,64,.8]],
 [[.25,69,1.2],[2,72,1.4]],[[.5,71,1],[2,67,1.25]],
 [[0,69,.8],[1,72,.8],[2.25,76,1.1]],[[0,74,1],[1.5,72,1.1],[3,67,.6]],
 [[0,65,.75],[1,69,.75],[2,72,1.2]],[[0,74,1],[1.5,71,.8],[3,67,.7]],
 [[0,76,1.25],[1.75,74,.6],[2.75,72,.8]],[[.5,67,.8],[1.75,72,1.25],[3.25,74,.6]],
 [[0,76,.8],[1.25,79,1.1],[2.75,76,.8]],[[0,77,1],[1.5,76,.75],[2.75,72,1]],
 [[0,74,.8],[1.25,72,.7],[2.5,69,1.1]],[[0,71,1],[1.5,74,.8],[3,72,.7]],
 [[0,69,1.5],[2,67,.8],[3.25,65,.6]],[[.5,67,1.5],[2.75,71,.8]],
 [[0,72,.8],[1,74,.5],[1.75,76,1.2],[3.25,79,.5]],[[0,76,1.1],[1.5,74,.8],[3,72,.75]],
 [[0,72,.9],[1.25,76,.8],[2.5,79,1]],[[0,74,1.1],[1.5,71,.8],[3,67,.75]],
 [[0,69,.8],[1,72,.8],[2.25,76,1.1]],[[0,74,1],[1.5,72,1.1],[3,67,.6]],
 [[0,65,.75],[1,69,.75],[2,72,1.2]],[[0,74,1],[1.5,71,.8],[3,67,.7]],
 [[.25,69,1],[1.75,67,.8],[3,65,.6]],[[0,64,3.5],[.025,67,3.5],[.05,72,3.5]]
];
for(let bar=0;bar<progression.length;bar++){
 const[bass,voicing]=chords[progression[bar]],thin=bar<2||bar===4||bar===5||bar>=26;
 const intensity=bar<2?.80:bar>=26?.75:bar>=18?1:.91;
 note(bar,0,bass,thin?3.3:1.8,.55*intensity,'bass');
 if(!thin)note(bar,2,bass+12,1.4,.40*intensity,'bass');
 if(bar!==27){
  for(const[index,pitch]of voicing.entries())note(bar,.9+index*.04,pitch,1.2,.35*intensity,'harmony');
  if(!thin)for(const[index,pitch]of voicing.entries())note(bar,3.15+index*.035,pitch,.7,.30*intensity,'harmony');
 }else for(const[index,pitch]of voicing.entries())note(bar,index*.035,pitch,3.5,.31,'harmony');
 for(const[offset,pitch,length]of melody[bar])note(bar,offset,pitch,length,(bar<2?.66:bar>=26?.62:.76)*intensity,'melody');
}
// The A/B microphones have unequal sensitivity. Balance their total energy
// before the room return while preserving the original stereo phase/width.
let energyLeft=0,energyRight=0;
for(let i=0;i<frames;i++){energyLeft+=mix[i*2]**2;energyRight+=mix[i*2+1]**2;}
const balance=(energyRight/energyLeft)**.25;
for(let i=0;i<frames;i++){mix[i*2]*=balance;mix[i*2+1]/=balance;}
// Short, quiet stereo room reflections preserve the attack and real piano body.
const dry=mix.slice();
for(const[delay,gain]of[[.031,.075],[.047,.06],[.083,.04],[.127,.031],[.193,.022],[.271,.014],[.389,.009]]){
 const gap=Math.round(delay*sr);
 for(let frame=gap;frame<frames;frame++){
  mix[frame*2]+=dry[(frame-gap)*2+1]*gain;mix[frame*2+1]+=dry[(frame-gap)*2]*gain;
 }
}
for(let i=0;i<frames;i++){
 const t=i/sr,gain=smooth(t/.18)*(1-smooth((t-(duration-2))/2));
 mix[i*2]*=gain;mix[i*2+1]*=gain;
}
const raw=path.join(scratch,'piano-performance.f32'),prepared=path.join(scratch,'piano-premaster.wav');
fs.writeFileSync(raw,Buffer.from(mix.buffer));
run(['-y','-f','f32le','-ar',String(sr),'-ac','2','-i',raw,'-af','highpass=f=42,lowpass=f=10000,acompressor=threshold=0.12:ratio=1.7:attack=18:release=200:makeup=1.1','-c:a','pcm_f32le',prepared]);
const measured=run(['-i',prepared,'-af',`loudnorm=I=${targetLufs}:TP=-1.7:LRA=9:print_format=json`,'-f','null','-'],{encoding:'utf8'});
const parseMeter=result=>JSON.parse(result.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
const meter=parseMeter(measured);
const masterFilter=`loudnorm=I=${targetLufs}:TP=-1.7:LRA=9:measured_I=${meter.input_i}:measured_TP=${meter.input_tp}:measured_LRA=${meter.input_lra}:measured_thresh=${meter.input_thresh}:offset=${meter.target_offset}:linear=true`+(trimDb?`,volume=${trimDb}dB`:'');
run(['-y','-i',prepared,'-af',masterFilter,'-ar',String(sr),'-ac','2','-c:a','pcm_s16le',output]);
const finalMeter=parseMeter(run(['-i',output,'-af',`loudnorm=I=${targetLufs}:TP=-1.5:LRA=9:print_format=json`,'-f','null','-'],{encoding:'utf8'}));
const cueSheet={duration,sampleRate:sr,targetLufs,bells:[],sfx:[],music:{
 title:'A Little Time',style:'Warm acoustic piano, lyrical melody and restrained moving accompaniment',
 bpm,key:'C major',timeSignature:'4/4',bars:28,noteCount:notes.length,
 sampleSource:'Salamander Grand Piano v3 — Alexander Holm; sfzinstruments FLAC conversion',
 sampleLicense:'CC BY 3.0 Unported',attribution:'audio-sources/salamander/ATTRIBUTION.md',
 composition:'Original melody, harmony, arrangement and programmed performance for Worthly; not an existing song.',
 sections:[
  {t:.25,name:'Opening question',bars:[0,1],character:'Light introduction with breathing room'},
  {t:+(.25+8*beat).toFixed(3),name:'Remember and decide',bars:[2,9],character:'First melody; thinner during waiting'},
  {t:+(.25+40*beat).toFixed(3),name:'Live with it and revisit',bars:[10,17],character:'Contrasting higher phrase with a gentle answer'},
  {t:+(.25+72*beat).toFixed(3),name:'See personal patterns',bars:[18,25],character:'Opening theme returns with fuller accompaniment'},
  {t:+(.25+104*beat).toFixed(3),name:'Keep the memory',bars:[26,27],character:'Quiet Fmaj7 to Cadd9 cadence, natural fade'}
 ],integratedLufs:Number(finalMeter.input_i),truePeakDbtp:Number(finalMeter.input_tp),loudnessRangeLu:Number(finalMeter.input_lra)
},notes};
const cues=path.join(root,'qa','reports','score-cues.json');
fs.mkdirSync(path.dirname(cues),{recursive:true});fs.writeFileSync(cues,JSON.stringify(cueSheet,null,2)+'\n');
console.log(`A Little Time · ${duration}s · ${bpm} BPM · C major · ${notes.length} real piano notes`);
console.log(`Master ${finalMeter.input_i} LUFS · ${finalMeter.input_tp} dBTP · ${finalMeter.input_lra} LU range`);
console.log(`48 kHz stereo PCM16 → ${path.relative(root,output)}`);
if(Math.abs(Number(finalMeter.input_i)-targetLufs)>.7||Number(finalMeter.input_tp)>-1.5)throw new Error('Master misses delivery loudness/peak limits');
