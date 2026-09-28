function ccInstrumentKey(run){const m=run.meta||{};return `${ccPlatform(run)} · ${m.InstrumentID||m.SerialNumber||m.InstrumentName||"unknown instrument"}`;}
