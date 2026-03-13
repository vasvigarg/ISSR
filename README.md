# (ISSR)  Humanlike AI Systems and Trust Attribution

*GSoC 2026 Screening Prototype:
Institute for Social Science Research · University of Alabama · HumanAI Umbrella Organization*


## Overview

This repository contains a modular experimentation engine designed to study trust calibration in human–AI decision systems. The platform systematically manipulates interface cues (agent naming, tone, and confidence framing) to measure behavioral reliance and trust attribution.

This project is a screening submission for the [ISSR3 proposal](https://humanai.foundation/gsoc/2026/proposal_ISSR3.html) for Google Summer of Code 2026.

### Primary Research Objectives
- Quantify Behavioral Trust: Moving beyond self-report scales to measure actual recommendation acceptance.
- Isolate Interface Effects: Determining how anthropomorphic cues vs. technical framing alter user reliance.
- Measure Calibration: Evaluating whether high-confidence AI "over-claims" lead to misaligned trust.


## Experiment Design

### Randomized A/B Conditions
Participants are randomly assigned to one of two experimental conditions (50/50 split):

| Feature | Condition A (Neutral) | Condition B (Humanlike) |
|:---|:---|:---|
| Agent identity | "System 4.1" (Label) | "Alex" (Name) |
| Role description | Analytical Decision Engine | AI advisor — here to help! |
| Tone of voice | Formal, technical, 3rd-person | Conversational, social, 1st-person |
| Confidence framing | Calibrated probability (72–94%) | Overstated certainty (88–99%) |
| Visual Cue | Blue-themed technical sigil | Warm-toned humanlike sigil |

### Decision Tasks
Participants evaluate 5 scenarios across domains (Medical, Finance, Engineering, etc.). 
- AI Accuracy: Experimentally controlled at 60% (3 correct, 2 incorrect recommendations).
- Behaviors Logged: Acceptance (Reliance), Override (Resistance), Latency, and Self-Reported Confidence.


## Event Schema & Data Logging

Every trial produces a high-resolution event log. Latency is captured using `performance.now()` for sub-millisecond precision.

```json
{
  "participant_id":           "P-A3X7B2K9",
  "condition":                "B",
  "condition_label":          "Humanlike / high-confidence cues",
  "trial":                    1,
  "scenario_id":              "S1",
  "decision":                 "accept",
  "ai_confidence_shown_pct":  96,
  "participant_confidence":   7,
  "latency_ms":               3812,
  "timestamp":                "2026-03-13T10:14:22.341Z"
}
```

## What makes this stronger than the bare minimum
- **`performance.now()` for latency** instead of `Date.now()` -> providing high-resolution, monotonic timing that matches the "high temporal resolution" requirements of the ISSR proposal.
- **Participant confidence slider (1–10)** -> although optional in the test spec, including this shows initiative and provides a secondary metric for trust attribution.
- **Dual Format Export** -> the engine supports both JSON and CSV exports as requested in the full project scope.
- **Three cue dimensions manipulated** -> the prototype manipulates agent naming, tone, AND confidence framing simultaneously, demonstrating readiness for the complex multi-condition framework.
- **Integrated Results Dashboard** -> providing immediate summary statistics for researchers to verify session data.


## Project Architecture

```
ISSR_TrustAttribution/
├── index.html       # Semantic structure & screen state management
├── style.css        # Premium UI (Dark mode, IBM Plex fonts, Glassmorphism)
├── experiment.js    # Core engine (Condition logic, Logging, Exports)
├── server.py        # Automated local server script
├── analysis.ipynb   # Behavioral analysis notebook (Python/Pandas)
├── sample_output/   # Analysis-ready datasets (JSON/CSV)
└── README.md        # Technical documentation
```


## Running the Experiment

### Option 1: Automated Server (Recommended)
This method automatically opens the experiment in your browser at `http://localhost:8080`.
```bash
python server.py
```

### Option 2: Basic Python Server
If you prefer the standard method:
```bash
python -m http.server 8080
```
Then manually visit: `http://localhost:8080`

### Running the Analysis Notebook
To run the analysis locally:
```bash
pip install jupyter pandas numpy matplotlib scipy
jupyter notebook analysis.ipynb
```



## Full Project Scope (GSoC)
This prototype satisfies the screening test requirements. The full GSoC project extends this to:

- Multi-condition framework supporting 3+ independently manipulated cue dimensions
- Persistent logging backend (SQLite or flat-file store) for multi-participant data collection
- Analysis notebook (Python/pandas) with reliance rate, override rate, and latency by condition
- Modular scenario/condition configuration via JSON config file
- Deployment instructions (one-click Vercel / Railway)
- Reproducible analysis workflows for publication-ready output



## Submission Details

**Applicant:** Vasvi Garg  
**Organization:** Alabama (ISSR)  
**Project:** Humanlike AI Systems and Trust Attribution  
**Mentors:** Andrya Allen, Dr. Xinyue Ye, Dr. Kelsey Chappetta, Dr. Andrea Underhill  

---