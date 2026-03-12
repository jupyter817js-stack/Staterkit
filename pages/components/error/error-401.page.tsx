import Seo from '@/shared/layout-components/seo/seo'
import Link from 'next/link'
import React, { Fragment, useEffect, useMemo, useState } from 'react'
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from "tsparticles";

const Error401 = () => {

  const [init, setInit] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadFull(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesLoaded: any = (container: any) => {
    };

    const options: any = useMemo(
        () => ({
            "particles": {
                "number": {
                    "value": 80,
                    "density": {
                        "enable": true,
                        "area": 800
                    }
                },
                "color": {
                    "value": "#845adf"
                },
                "shape": {
                    "type": "circle",
                    "stroke": {
                        "width": 0,
                        "color": "#845adf"
                    },
                    "polygon": {
                        "nb_sides": 5
                    },
                    "image": {
                        "src": "img/github.svg",
                        "width": 100,
                        "height": 100
                    }
                },
                "opacity": {
                    "value": 0.5,
                    "random": false,
                    "anim": {
                        "enable": false,
                        "speed": 1,
                        "opacity_min": 0.1,
                        "sync": false
                    }
                },
                "size": {
                    "value": 2,
                    "random": true,
                    "anim": {
                        "enable": false,
                        "speed": 40,
                        "size_min": 0.1,
                        "sync": false
                    }
                },
                "links": {
                    "enable": true,
                    "distance": 150,
                    "color": "#d1d9e0",
                    "opacity": 0.4,
                    "width": 1
                },
                "move": {
                    "enable": true,
                    "speed": 2,
                    "direction": "none",
                    "random": false,
                    "straight": false,
                    "out_mode": "out",
                    "bounce": false,
                    "attract": {
                        "enable": false,
                        "rotateX": 600,
                        "rotateY": 1200
                    }
                }
            },
            "interactivity": {
                "detectsOn": "canvas",
                "events": {
                    "onHover": {
                        "enable": true,
                        "mode": "grab"
                    },
                    "onClick": {
                        "enable": true,
                        "mode": "push"
                    },
                    "resize": true
                },
                "modes": {
                    "grab": {
                        "distance": 150,
                        "links": {
                            "opacity": 1
                        }
                    },
                    "bubble": {
                        "distance": 400,
                        "size": 40,
                        "duration": 2,
                        "opacity": 8,
                        "speed": 3
                    },
                    "repulse": {
                        "distance": 200,
                        "duration": 0.4
                    },
                    "push": {
                        "particles_nb": 4
                    },
                    "remove": {
                        "particles_nb": 2
                    }
                }
            },
            "detectRetina": true
        }),
        [],
    );

  return (
    <Fragment>
      <Seo title={"Error 401"}/>
      <div className="page error-bg dark:!bg-bodybg" id="particles-js">
        <div className="error-page">
            <div className="container text-defaulttextcolor text-defaultsize">
                <div className="text-center p-5 my-auto">
                    <div className="flex items-center justify-center h-full ">
                      <div className="xl:col-span-3"></div>
                        <div className="xl:col-span-6 col-span-12">
                            <p className="error-text sm:mb-0 mb-2">401</p>
                            <p className="text-[1.125rem] font-semibold mb-4 dark:text-defaulttextcolor/70">Oops 😭,The page you are looking for is not available.</p>
                            <div className="flex justify-center items-center mb-[3rem]">
                                <div className="xl:col-span-6 w-[50%]">
                                    <p className="mb-0 opacity-[0.7]">We are sorry for the inconvenience,The page you are trying to access has been removed or never been existed.</p>
                                </div>
                            </div>
                            <Link href="/login" className="ti-btn bg-primary text-white font-semibold dark:border-defaultborder/10"><i className="ri-arrow-left-line align-middle inline-block"></i>로그인으로</Link>
                        </div>
                        <div className="xl:col-span-3"></div>
                    </div>
                </div>
            </div>
        </div>
    <Particles id="tsparticles" particlesLoaded={particlesLoaded} options={options}/>
    </div>
    </Fragment>
  )
}

Error401.layout = "Authenticationlayout"

export default Error401