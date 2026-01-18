
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

function ProductPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [tempProduct, setTempProduct] = useState(null); // 用於顯示細節或編輯
  const [isEditMode, setIsEditMode] = useState(false); // 是否為編輯/新增模式

  const getProducts = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/${API_PATH}/admin/products/all`
      );
      setProducts(Object.values(res.data.products));
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "取得產品列表失敗",
        text: error.response?.data?.message || "發生未知錯誤",
      });
    }
  }, []);

  const checkLogin = useCallback(async () => {
    try {
      await axios.post(`${API_BASE}/api/user/check`);
      getProducts();
    } catch {
      Swal.fire({
        text: "請重新登入",
      }).then(() => {
        navigate("/");
      });
    }
  }, [getProducts, navigate]);

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("hexToken="))
      ?.split("=")
      .slice(1)
      .join("=");

    if (!token) {
        Swal.fire({ text: '請先登入' }).then(() => {
            navigate("/");
        })
      return;
    }
    axios.defaults.headers.common["Authorization"] = token;
    checkLogin();
  }, [checkLogin, navigate]);


  const openModal = (mode, product) => {
    if (mode === 'new') {
      setTempProduct({
        title: '',
        category: '',
        origin_price: 100,
        price: 100,
        unit: '個',
        description: '',
        content: '',
        is_enabled: 1,
        imageUrl: '',
        imagesUrl: [],
      });
      setIsEditMode(true);
    } else if (mode === 'edit') {
      setTempProduct({ ...product });
      setIsEditMode(true);
    } else if (mode === 'view') {
        setTempProduct({ ...product });
        setIsEditMode(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
        setTempProduct({ ...tempProduct, [name]: checked ? 1 : 0 });
    } else if (type === 'number') {
        setTempProduct({ ...tempProduct, [name]: Number(value) });
    }
    else {
        setTempProduct({ ...tempProduct, [name]: value });
    }
  };

  const saveProduct = async () => {
    try {
      let res;
      if (tempProduct.id) { // 如果有 id, 代表是編輯
        res = await axios.put(`${API_BASE}/api/${API_PATH}/admin/product/${tempProduct.id}`, { data: tempProduct });
      } else { // 否則為新增
        res = await axios.post(`${API_BASE}/api/${API_PATH}/admin/product`, { data: tempProduct });
      }
      Swal.fire({ icon: 'success', title: res.data.message });
      getProducts();
      setIsEditMode(false);
      if (res.data.product) {
          setTempProduct(res.data.product);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "儲存失敗",
        text: error.response?.data?.message || "未知錯誤",
      });
    }
  };

  const deleteProduct = async (id) => {
    Swal.fire({
        title: '確定要刪除嗎?',
        text: "此操作無法復原！",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: '是的, 刪除它！',
        cancelButtonText: '取消'
      }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await axios.delete(`${API_BASE}/api/${API_PATH}/admin/product/${id}`);
                Swal.fire({ icon: 'success', title: res.data.message });
                getProducts();
                setTempProduct(null);
              } catch (error) {
                Swal.fire({
                  icon: "error",
                  title: "刪除失敗",
                  text: error.response?.data?.message || "未知錯誤",
                });
              }
        }
      })
  };


  return (
    <div className="container">
       <div className="row mt-5">
        <div className="col-md-7">
          <h2>產品列表</h2>
          <div className="text-end">
            <button className="btn btn-primary" onClick={() => openModal('new')}>
              建立新產品
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>產品名稱</th>
                <th>原價</th>
                <th>售價</th>
                <th>是否啟用</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {products && products.length > 0 ? (
                products.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.origin_price}</td>
                    <td>{item.price}</td>
                    <td className={item.is_enabled ? "text-success" : "text-danger"}>
  {item.is_enabled ? "啟用" : "未啟用"}
</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => openModal('view', item)}
                      >
                        查看
                      </button>
                      <button
                        className="btn btn-sm btn-outline-success me-2"
                        onClick={() => openModal('edit', item)}
                      >
                        編輯
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deleteProduct(item.id)}
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">尚無產品資料</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="col-md-5">
          <h2>{isEditMode ? (tempProduct.id ? '編輯產品' : '新增產品') : '單一產品細節'}</h2>
          {tempProduct ? (
            isEditMode ? (
                // --- 編輯/新增表單 ---
                <div>
                    <div className="mb-3">
                        <label htmlFor="title" className="form-label">標題</label>
                        <input type="text" className="form-control" id="title" name="title" value={tempProduct.title} onChange={handleInputChange} />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="category" className="form-label">分類</label>
                        <input type="text" className="form-control" id="category" name="category" value={tempProduct.category} onChange={handleInputChange} />
                    </div>
                     <div className="row">
                        <div className="mb-3 col-md-6">
                            <label htmlFor="origin_price" className="form-label">原價</label>
                            <input type="number" className="form-control" id="origin_price" name="origin_price" value={tempProduct.origin_price} onChange={handleInputChange} />
                        </div>
                        <div className="mb-3 col-md-6">
                            <label htmlFor="price" className="form-label">售價</label>
                            <input type="number" className="form-control" id="price" name="price" value={tempProduct.price} onChange={handleInputChange} />
                        </div>
                    </div>
                    <hr />
                    <div className="mb-3">
                        <label htmlFor="description" className="form-label">產品描述</label>
                        <textarea className="form-control" id="description" name="description" value={tempProduct.description} onChange={handleInputChange} rows="3"></textarea>
                    </div>
                     <div className="mb-3">
                        <label htmlFor="content" className="form-label">說明內容</label>
                        <textarea className="form-control" id="content" name="content" value={tempProduct.content} onChange={handleInputChange} rows="3"></textarea>
                    </div>
                    <div className="mb-3">
                        <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="is_enabled" name="is_enabled" checked={!!tempProduct.is_enabled} onChange={handleInputChange} />
                            <label className="form-check-label" htmlFor="is_enabled">
                                是否啟用
                            </label>
                        </div>
                    </div>
                    <div className="text-end">
                        <button className="btn btn-outline-secondary me-2" onClick={() => { setIsEditMode(false); setTempProduct(null); }}>取消</button>
                        <button className="btn btn-primary" onClick={saveProduct}>儲存</button>
                    </div>
                </div>
            ) : (
            // --- 產品細節 ---
            <div className="card mb-3">
              <img
                src={tempProduct.imageUrl}
                className="card-img-top primary-image"
                alt={tempProduct.title}
              />
              <div className="card-body text-start">
                <h5 className="card-title">
                  {tempProduct.title}
                  <span className="badge bg-primary ms-2">
                    {tempProduct.category}
                  </span>
                </h5>
                <p className="card-text">
                  商品描述：
                  <span style={{ whiteSpace: 'pre-wrap' }}>{tempProduct.description}</span>
                </p>
                <p className="card-text">
                  商品內容：
                  <span style={{ whiteSpace: 'pre-wrap' }}>{tempProduct.content}</span>
                </p>
                <div className="d-flex">
                  <p className="card-text text-secondary me-2">
                    原價：<del>{tempProduct.origin_price}</del> 元
                  </p>
                   <p className="card-text">
                    售價：{tempProduct.price} 元
                  </p>
                </div>
                <h5 className="mt-3">更多圖片：</h5>
                <div className="d-flex flex-wrap">
                  {tempProduct.imagesUrl?.map((url, index) => (
                    <img key={index} src={url} className="images" alt="副圖" />
                  ))}
                </div>
              </div>
            </div>
            )
          ) : (
            <p className="text-secondary">請選擇一個商品或建立新商品</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductPage;
