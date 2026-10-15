i=0
for u in "$@"; do i=$((i+1))
npx -y lighthouse "$u" --only-categories=accessibility --preset=desktop --output=json --output-path=./lh$i.json --chrome-flags="--headless=new" --quiet >/dev/null 2>&1
node -e '
const r=require("./lh'$i'.json");console.log("\n=====",r.finalDisplayedUrl,"score",r.categories.accessibility.score);
for(const a of Object.values(r.audits)){if(a.score===0){console.log("##",a.id);for(const i of (a.details?.items??[]).slice(0,6)){console.log(" -",i.node?.selector,"|",i.node?.snippet?.slice(0,140),"|",(i.node?.explanation||"").split("\n")[1]?.slice(0,220))}}}'
done
