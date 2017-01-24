'use strict';

const narrative = {
  "E": {
    "low": "This indicates you are introverted, reserved, and quiet. You enjoy alone-time and would often prefer it over some big social event. Your socializing tends to be restricted to a few close friends.",
    "avg": "This indicates you are neither a subdued loner nor a jovial chatterbox. You enjoy time with others but also time alone.",
    "high": "This indicates you are sociable, outgoing, energetic, and lively. You prefer to be around people much of the time."
  },
  "A": {
    "low": "This indicates less concern with others' needs than with your own. People see you as tough, critical, and uncompromising.",
    "avg": "This indicates some concern with others' needs, but, generally, you would not choose to sacrifice yourself for others.",
    "high": "This indicates a strong interest in others' needs and well-being. You are pleasant, sympathetic, and cooperative."
  },
  "C": {
    "low": "This indicates you like to live for the moment and do what feels good now. Your work tends to be careless and disorganized.",
    "avg": "This means you are reasonably reliable, organized, and self-controlled.",
    "high": "This means you set clear goals and pursue them with determination. People regard you as reliable and hard-working."
  },
  "N": {
    "low": "This indicates that you are exceptionally calm and composed. You do not react with intense emotions, even to situations that most people would describe as stressful.",
    "avg": "This indicates that your level of emotional reactivity is typical of the general population. You likely do not get more easily upset than most of your friends, but you are not viewed as uncommonly calm either. You are fairly balanced emotionally.",
    "high": "This indicates that you are easily upset, even by what most people consider the normal demands of life. People consider you to be sensitive and emotional."
  },
  "I": {
    "low": "This indicates you like to think in plain and simple terms. Others describe you as down-to-earth, practical, and conservative.",
    "avg": "This indicates you enjoy tradition but are willing to try new things. Your thinking is neither simple nor complex. To others you appear to be a well-educated person but not an intellectual.",
    "high": "This indicates you enjoy novelty, variety, and change. You are curious, imaginative, and creative."
  }
};

const ipip_ranges = {
  "E": {"low": [1, 9], "avg": [10, 13], "high": [14, 20]},
  "A": {"low": [1, 13], "avg": [14, 16], "high": [17, 20]},
  "C": {"low": [1, 10], "avg": [11, 14], "high": [15, 20]},
  "N": {"low": [1, 6], "avg": [7, 9], "high": [10, 20]},
  "I": {"low": [1, 12], "avg": [13, 15], "high": [16, 20]}
};

const ipip_algorithm = module.exports = (ans) => {
  const num_arr = [6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 20];
  const trait_range = ["low", "avg", "high"];
  //Reverse negative keyed items and calculate score for each trait.

  for (let key in num_arr) {
    ans[num_arr[key]] = 6 - ans[num_arr[key]];
  }

  const ipip_scores         = {};
  const trait_keys          = Object.keys(narrative);
  const trait_keys_iterator = trait_keys.entries();

  for (let item of trait_keys_iterator) {
    let indx = item[0], trait = item[1];
    ipip_scores[trait] = ans[indx+1] + ans[indx+6] + ans[indx+11] + ans[indx+16];
  }

  const output = {};
  for(let trait in ipip_scores){
    for(let idx in ["low", "avg", "high"]){
      if(ipip_scores[trait] >= ipip_ranges[trait][trait_range[idx]][0] &&
        ipip_scores[trait] <= ipip_ranges[trait][trait_range[idx]][1]){
        output[trait] = {
          "text": narrative[trait][trait_range[idx]],
          "score": Math.round((ipip_scores[trait]/20.0) * 100)
        };
      }
    }
  }
  return output;
};

//test data
//console.log(ipip_algorithm([2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]));
//output object to json to test python script
//console.log(JSON.stringify({1: 3, 2: 1, 3: 3, 4: 2, 5: 1, 6: 2, 7: 1, 8: 5, 9: 5, 10: 5, 11: 3, 12: 4, 13: 4, 14: 4, 15: 5, 16: 4, 17: 5, 18: 1, 19: 5, 20: 3}));