import store from "@/shared/redux/store";
import Link from "next/link";
import { Fragment} from "react";

function Menuloop({ MenuItems, toggleSidemenu, level, HoverToggleInnerMenuFn, t, expandedKeys, setExpandedKeys }: any) {
  const theme = store.getState();
  const resolveTitle = (item: any) => (item?.titleKey && t ? t(item.titleKey) : item?.title);
  const isOpen = (expandedKeys != null && MenuItems?.titleKey && expandedKeys.has(MenuItems.titleKey)) || MenuItems?.active;

  const handleParentClick = (event: any) => {
    event.preventDefault();
    if (setExpandedKeys && MenuItems?.titleKey) {
      setExpandedKeys((prev: Set<string>) => {
        const next = new Set(prev);
        if (next.has(MenuItems.titleKey)) next.delete(MenuItems.titleKey);
        else next.add(MenuItems.titleKey);
        return next;
      });
    }
    toggleSidemenu(event, MenuItems, undefined, true);
  };

  return (
    <Fragment>
      <Link href="#!" className={`side-menu__item ${MenuItems?.selected ? "active" : ""}`}
        onClick={handleParentClick} onMouseEnter={(event) => HoverToggleInnerMenuFn(event, MenuItems)}>{MenuItems.icon}<span className={`${level == 1 ? "side-menu__label" : ""}`}> {resolveTitle(MenuItems)} {MenuItems.badgetxt ? (<span className={MenuItems.class}> {MenuItems.badgetxt} </span>
        ) : (
          ""
        )}
        </span>
        <i className="fe fe-chevron-right side-menu__angle"></i>
      </Link>
      <ul className={`slide-menu child${level}  
      ${isOpen && level == 1 && theme.dataVerticalStyle === "doublemenu" ? 'double-menu-active' : ''} 
      ${MenuItems?.dirchange ? "force-left" : ""} `} style={isOpen ? { display: "block" } : { display: "none" }}
      >
        {level <= 1 ? <li className="slide side-menu__label1">
          <Link href="#!">{resolveTitle(MenuItems)}</Link>
        </li> : ""}
        {MenuItems.children.map((firstlevel: any) =>
          <li className={`${firstlevel.menutitle ? 'slide__category' : ''} ${firstlevel?.type == 'empty' ? 'slide' : ''} ${firstlevel?.type == 'link' ? 'slide' : ''} ${firstlevel?.type == 'sub' ? 'slide has-sub' : ''} ${firstlevel?.active ? 'open' : ''} ${firstlevel?.selected ? 'active' : ''}`} key={Math.random()}>
            {firstlevel.type === "link" ?
              <Link href={firstlevel.path.includes("#") ? firstlevel.path : firstlevel.path + "/"} className={`side-menu__item ${firstlevel.selected ? 'active' : ''}`}>{firstlevel.icon}
                <span className=""> {resolveTitle(firstlevel)} {firstlevel.badgetxt ? (<span className={firstlevel.class}> {firstlevel.badgetxt}</span>
                ) : (
                  ""
                )}
                </span>
              </Link>
              : ""}
            {firstlevel.type === "empty" ?
              <Link href="#" className='side-menu__item'> {firstlevel.icon}<span className=""> {firstlevel.title} {firstlevel.badgetxt ? (<span className={firstlevel.class}> {firstlevel.badgetxt} </span>
              ) : (
                ""
              )}
              </span>
              </Link>
              : ""}
            {firstlevel.type === "sub" ?
              <Menuloop MenuItems={firstlevel} toggleSidemenu={toggleSidemenu} HoverToggleInnerMenuFn={HoverToggleInnerMenuFn} level={level + 1} t={t} expandedKeys={expandedKeys} setExpandedKeys={setExpandedKeys} />
              : ''}

          </li>
        )}

      </ul>
    </Fragment>
  );
}
export default Menuloop;
