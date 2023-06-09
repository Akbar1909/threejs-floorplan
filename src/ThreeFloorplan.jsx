import React, { useEffect, useRef, useState } from "react";
import threeInit, { options } from "./threeInit";

const ThreeFloorplan = () => {
  const canvasRef = useRef(null);
  const [value, setValue] = useState("alpha");

  useEffect(() => {
    threeInit(
      canvasRef.current,
      (id) => {
        console.log(id);
      },
      value
    );
  }, [value]);

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex" }}>
      <aside style={{ width: "300px" }}>Filter</aside>
      <section style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header style={{ height: "100px" }}>
          <select value={value} onChange={(e) => setValue(e.target.value)}>
            {options.map((option) => (
              <option value={option.value}>{option.label}</option>
            ))}
          </select>
        </header>

        <div id="floorplan">
          <canvas
            ref={canvasRef}
            style={{ position: "absolute", zIndex: 1, bottom: 0, right: 0 }}
          />
        </div>
      </section>
    </div>
  );

  return (
    <>
      {/* <select value={value} onChange={(e) => setValue(e.target.value)}>
        {options.map((option) => (
          <option value={option.value}>{option.label}</option>
        ))}
      </select> */}
      <div id="floorplan">
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", zIndex: 1, top: 0, left: 0 }}
        />
      </div>
    </>
  );
};

export default ThreeFloorplan;
