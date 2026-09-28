set -e
cd /home/claude/gif
for C in S1 S2 S3 S4 S5 S6 S7 S8; do
  # concat list: the 15 s build written four times -> 60.0 s of content
  : > seq/$C/list.txt
  for R in 1 2 3 4; do
    for F in seq/$C/f*.png; do echo "file '/home/claude/gif/$F'" >> seq/$C/list.txt; echo "duration 0.1" >> seq/$C/list.txt; done
  done
  ffmpeg -v error -y -f concat -safe 0 -i seq/$C/list.txt -vf "palettegen=max_colors=200:stats_mode=diff" seq/$C/pal.png
  ffmpeg -v error -y -f concat -safe 0 -i seq/$C/list.txt -i seq/$C/pal.png \
     -lavfi "paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" -r 10 -loop 0 \
     out/assets/scenarios/missy_scenario_${C}_60s.gif
  ffmpeg -v error -y -f concat -safe 0 -i seq/$C/list.txt -c:v libx264 -pix_fmt yuv420p -r 30 -crf 18 \
     out/missy_scenario_${C}_60s.mp4
  echo "built $C"
done
