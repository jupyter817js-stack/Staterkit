import Seo from "@/shared/layout-components/seo/seo";
import Link from "next/link";
import React, { Fragment, useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from "tsparticles";
import { getAuthToken } from "@/shared/api/auth";

const DEFAULT_AUTH_HOME = "/";

const Error404 = () => {
  const [init, setInit] = useState(false);
  const [homeHref, setHomeHref] = useState("/");

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    }).then(() => setInit(true));
  }, []);

  useEffect(() => {
    setHomeHref(getAuthToken() ? DEFAULT_AUTH_HOME : "/");
  }, []);

  const options: any = useMemo(
    () => ({
      particles: {
        number: { value: 80, density: { enable: true, area: 800 } },
        color: { value: "#845adf" },
        shape: { type: "circle", stroke: { width: 0, color: "#845adf" } },
        opacity: { value: 0.5, random: false },
        size: { value: 2, random: true },
        links: { enable: true, distance: 150, color: "#d1d9e0", opacity: 0.4, width: 1 },
        move: { enable: true, speed: 2, direction: "none", random: false, straight: false, out_mode: "out", bounce: false },
      },
      interactivity: {
        detectsOn: "canvas",
        events: { onHover: { enable: true, mode: "grab" }, onClick: { enable: true, mode: "push" }, resize: true },
        modes: { grab: { distance: 150, links: { opacity: 1 } }, push: { particles_nb: 4 } },
      },
      detectRetina: true,
    }),
    []
  );

  return (
    <Fragment>
      <Seo title="Error 404" />
      <div className="page error-bg dark:!bg-bodybg" id="particles-js">
        <div className="error-page">
          <div className="container text-defaulttextcolor text-defaultsize">
            <div className="text-center p-5 my-auto">
              <div className="flex items-center justify-center h-full">
                <div className="xl:col-span-3"></div>
                <div className="xl:col-span-6 col-span-12">
                  <p className="error-text sm:mb-0 mb-2">404</p>
                  <p className="text-[1.125rem] font-semibold mb-4 dark:text-defaulttextcolor/70">
                    페이지를 찾을 수 없습니다
                  </p>
                  <div className="flex justify-center items-center mb-[3rem]">
                    <div className="xl:col-span-6 w-[50%]">
                      <p className="mb-0 opacity-[0.7]">
                        요청하신 페이지가 존재하지 않거나 삭제되었을 수 있습니다.
                      </p>
                    </div>
                  </div>
                  <Link
                    href={homeHref}
                    className="ti-btn bg-primary text-white font-semibold dark:border-defaultborder/10"
                  >
                    <i className="ri-arrow-left-line align-middle inline-block"></i>홈으로 돌아가기
                  </Link>
                </div>
                <div className="xl:col-span-3"></div>
              </div>
            </div>
          </div>
        </div>
        {init && <Particles id="tsparticles" options={options} />}
      </div>
    </Fragment>
  );
};

Error404.layout = "Authenticationlayout";
export default Error404;
